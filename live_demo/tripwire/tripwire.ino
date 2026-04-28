// ESP-NOW TRIPWIRE - RECEIVER (Motion Detector + Alert)
// =====================================================
// Flash this onto the OTHER ESP-32. It listens for ESP-NOW
// broadcasts from the beacon board and measures the RSSI of
// each received packet. Once a baseline is established, a
// sudden RSSI drop means something (a person) has crossed
// the direct path between beacon and receiver - the tripwire
// is broken.
//
// When the tripwire trips, the receiver sends an HTTP POST
// to the motion server over regular WiFi, tagged as
// "tripwire_broken" so it shows up distinctly on the dashboard.

#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_now.h>

// -------------------- CONFIG --------------------
const char* ssid     = "whyit";
const char* password = "whyit12345";
// Fallback if auto-discovery fails. Update settings.json + apply_settings.py
// to change this value; auto-discovery (below) usually overrides it anyway.
const char* serverUrlFallback = "http://172.20.10.2:5000/motion";
const char* sensorId           = "tripwire_receiver";

// On startup, scan the local subnet for the Flask server so we don't have
// to hard-code the PC's IP. iPhone hotspots use 172.20.10.0/28 (.1-.14),
// so the loop is fast. Set to false to skip discovery and always use the
// fallback URL above.
#define AUTO_DISCOVER_SERVER  true
const int  DISCOVERY_TIMEOUT_MS = 250;
const int  DISCOVERY_PORT       = 5000;

// Holds the resolved server URL after discovery (or the fallback).
String     serverUrl = "";

// Adaptive (EMA) baseline - the baseline continuously drifts toward
// the current RSSI so the system tracks slow environmental changes:
//   * moving the boards to new positions
//   * a person sitting in the beam (eventually becomes the "new normal")
//   * router load changes, temperature, humidity, etc.
// The drift is slow enough that fast events (a person walking through
// in 1-2 seconds) still stand out and trigger the tripwire.
const int   WARMUP_SAMPLES       = 30;    // ~3 s to seed an initial value
const float BASELINE_ALPHA       = 0.01;  // EMA drift factor (slow)
const int   RSSI_DELTA_THRESHOLD = 4;     // dBm deviation to count as motion
const int   CONSECUTIVE_TRIGGERS = 2;     // filter single-sample noise
const unsigned long COOLDOWN_MS  = 5000;  // min ms between alerts

// -------------------- STATE --------------------
// These are touched from the ESP-NOW receive callback and from
// loop(), so mark them volatile.
volatile float         baselineRssi   = 0;    // adaptive (EMA)
volatile int           warmupCount    = 0;
volatile bool          baselineReady  = false;
volatile int           triggerStreak  = 0;
volatile unsigned long packetsRecv    = 0;

// Flag + latched values - set in the callback, consumed in loop().
volatile bool          alertPending = false;
volatile int           alertRssi    = 0;
volatile int           alertDelta   = 0;

unsigned long lastAlertTime = 0;
int printModulo = 10;   // print ~once per second at 10 Hz

// -------------------- FUNCTIONS --------------------
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected.  IP=");
  Serial.print(WiFi.localIP());
  Serial.print("  channel=");
  Serial.print(WiFi.channel());
  Serial.print("  MAC=");
  Serial.println(WiFi.macAddress());
}

// Try a single candidate IP. Returns true if a Flask server seems to be
// listening on port 5000 there.
bool probeServer(const String& ip) {
  WiFiClient client;
  client.setTimeout(DISCOVERY_TIMEOUT_MS / 1000);
  if (!client.connect(ip.c_str(), DISCOVERY_PORT, DISCOVERY_TIMEOUT_MS)) {
    return false;
  }
  // Send a minimal HTTP request. Any 2xx/3xx/4xx response means a real
  // HTTP server is on the other end (our /motion route returns 405 for
  // GET, which is still a valid HTTP response).
  client.print("GET / HTTP/1.0\r\nHost: ");
  client.print(ip);
  client.print("\r\n\r\n");
  unsigned long start = millis();
  while (!client.available() && (millis() - start) < (unsigned long)DISCOVERY_TIMEOUT_MS) {
    delay(5);
  }
  if (!client.available()) {
    client.stop();
    return false;
  }
  String line = client.readStringUntil('\n');
  client.stop();
  return line.startsWith("HTTP/");
}

// Walk the subnet (same first three octets as our own IP) looking for a
// Flask server. Sets serverUrl and returns true on success.
bool discoverServer() {
  IPAddress me = WiFi.localIP();
  String prefix = String(me[0]) + "." + String(me[1]) + "." + String(me[2]) + ".";
  Serial.print("Discovering server on ");
  Serial.print(prefix);
  Serial.println("0/28 ...");
  // iPhone hotspot is /28 -> 14 usable hosts. Cover .1 .. .14 cheaply.
  // Order: try .2 first (most common), then walk the rest.
  int order[14];
  order[0] = 2;
  int idx = 1;
  for (int i = 1; i <= 14; i++) {
    if (i == 2 || i == me[3]) continue;
    order[idx++] = i;
  }
  for (int k = 0; k < idx; k++) {
    int i = order[k];
    String ip = prefix + String(i);
    Serial.print("  trying "); Serial.print(ip); Serial.print(" ... ");
    if (probeServer(ip)) {
      serverUrl = "http://" + ip + ":" + String(DISCOVERY_PORT) + "/motion";
      Serial.println("FOUND");
      Serial.print("Server resolved to: ");
      Serial.println(serverUrl);
      return true;
    }
    Serial.println("no");
  }
  Serial.println("Discovery failed - using fallback URL.");
  return false;
}

void sendTripwireAlert(int rssi, int delta) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi dropped - reconnecting...");
    connectWiFi();
  }
  HTTPClient http;
  http.begin(serverUrl.c_str());
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"sensor_id\":\"";
  payload += sensorId;
  payload += "\",\"event\":\"tripwire_broken\",\"rssi\":";
  payload += String(rssi);
  payload += ",\"delta\":";
  payload += String(delta);
  payload += "}";

  unsigned long t0 = millis();
  int code = http.POST(payload);
  unsigned long latency = millis() - t0;

  Serial.print("  -> alert sent. HTTP ");
  Serial.print(code);
  Serial.print("  latency=");
  Serial.print(latency);
  Serial.println(" ms");
  http.end();
}

// ESP-NOW receive callback - fires for every broadcast we hear.
void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  int rssi = info->rx_ctrl->rssi;
  packetsRecv++;

  // Phase 1 - short warmup to seed the baseline with a simple running average.
  if (!baselineReady) {
    if (warmupCount == 0) {
      baselineRssi = rssi;
    } else {
      baselineRssi = (baselineRssi * warmupCount + rssi) / (warmupCount + 1);
    }
    warmupCount++;
    if (warmupCount >= WARMUP_SAMPLES) {
      baselineReady = true;
    }
    return;
  }

  // Phase 2 - deviation check against the current (adaptive) baseline.
  int delta = abs(rssi - (int)baselineRssi);
  if (packetsRecv % printModulo == 0) {
    Serial.print("RSSI=");
    Serial.print(rssi);
    Serial.print(" dBm  baseline=");
    Serial.print(baselineRssi, 1);
    Serial.print("  delta=");
    Serial.println(delta);
  }

  if (delta >= RSSI_DELTA_THRESHOLD) {
    triggerStreak++;
    if (triggerStreak >= CONSECUTIVE_TRIGGERS) {
      // Defer the HTTP work to loop() - network I/O in a callback
      // can starve the radio.
      alertRssi = rssi;
      alertDelta = delta;
      alertPending = true;
      triggerStreak = 0;
    }
  } else {
    triggerStreak = 0;
  }

  // Phase 3 - adaptive baseline update (Exponential Moving Average).
  // Runs on every packet, not just quiet ones. Fast events (a person
  // walking through in 1-2 s ~ 10-20 packets) barely nudge the baseline
  // because each sample only moves it 1% of the way toward the new value.
  // Slow events (moved boards, stationary person) get absorbed over
  // ~20-30 seconds so the tripwire self-recalibrates.
  baselineRssi = (1.0f - BASELINE_ALPHA) * baselineRssi + BASELINE_ALPHA * rssi;
}

// -------------------- SETUP / LOOP --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=== ESP-NOW Tripwire Receiver booting ===");
  Serial.print("Sensor ID: ");
  Serial.println(sensorId);

  connectWiFi();

  // Resolve serverUrl: try auto-discovery, fall back to hardcoded value.
  serverUrl = String(serverUrlFallback);
#if AUTO_DISCOVER_SERVER
  if (!discoverServer()) {
    serverUrl = String(serverUrlFallback);
  }
#endif
  Serial.print("Using server: ");
  Serial.println(serverUrl);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init FAILED - halting.");
    while (true) { delay(1000); }
  }
  esp_now_register_recv_cb(onDataRecv);

  Serial.println();
  Serial.println("Waiting for beacon packets...");
  Serial.println("Keep the path CLEAR for 10s while baseline calibrates.");
}

void loop() {
  // Baseline-ready announcement (printed once).
  static bool announced = false;
  if (baselineReady && !announced) {
    announced = true;
    Serial.print("Baseline RSSI = ");
    Serial.print(baselineRssi, 1);
    Serial.println(" dBm. Tripwire armed.");
  }

  // Handle any pending alert from the callback.
  if (alertPending) {
    int r = alertRssi;
    int d = alertDelta;
    alertPending = false;

    unsigned long now = millis();
    if (now - lastAlertTime >= COOLDOWN_MS) {
      Serial.println(">>> TRIPWIRE BROKEN <<<");
      sendTripwireAlert(r, d);
      lastAlertTime = now;
    }
  }
  delay(5);
}
