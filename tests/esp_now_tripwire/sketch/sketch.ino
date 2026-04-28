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
const char* serverUrl = "http://YOUR_SERVER_IP:5000/motion";
const char* sensorId  = "tripwire_receiver";

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

void sendTripwireAlert(int rssi, int delta) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi dropped - reconnecting...");
    connectWiFi();
  }
  HTTPClient http;
  http.begin(serverUrl);
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
  Serial.print("Server:    ");
  Serial.println(serverUrl);

  connectWiFi();

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
