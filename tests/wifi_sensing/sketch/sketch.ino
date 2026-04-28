// WIFI-ONLY MOTION SENSING - CNT 1510 Wireless Networking (Nice Have)
// =====================================================
// Detects motion without any physical sensor by monitoring
// the RSSI (received signal strength) between this ESP-32 and
// the WiFi router. When a person moves nearby, the RSSI
// wobbles. A sudden deviation from the baseline triggers an
// HTTP motion alert to the same central server the PIR uses.
//
// Concept: the human body absorbs/reflects 2.4 GHz WiFi
// signals. Movement changes the multipath propagation,
// which is detectable in RSSI fluctuations.

#include <WiFi.h>
#include <HTTPClient.h>

// -------------------- CONFIG --------------------
const char* ssid     = "whyit";
const char* password = "whyit12345";
const char* serverUrl = "http://YOUR_SERVER_IP:5000/motion";

// Set this per board when flashing multiple ESP-32s.
const char* sensorId  = "wifi_sensor_2";

// How often to sample RSSI (ms). Faster = more sensitive but noisier.
const unsigned long SAMPLE_INTERVAL_MS = 100;

// How many samples to take during the initial baseline window.
// 100 samples * 100 ms = 10 seconds of "room empty" baseline.
const int BASELINE_SAMPLES = 100;

// Motion threshold - how many dBm of deviation from baseline counts.
// Typical idle noise is 1-2 dBm; a person moving nearby often causes
// 3-8 dBm swings. 4 is a reasonable default.
const int RSSI_DELTA_THRESHOLD = 4;

// How many consecutive "out of range" samples before we fire.
// Filters out single-sample WiFi noise spikes.
const int CONSECUTIVE_TRIGGERS = 2;

// Cooldown between alerts (ms).
const unsigned long COOLDOWN_MS = 5000;

// -------------------- STATE --------------------
float baselineRssi = 0;
bool  baselineReady = false;
int   triggerStreak = 0;
unsigned long lastAlertTime = 0;

// -------------------- FUNCTIONS --------------------
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.print(WiFi.localIP());
  Serial.print("   baseline RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void sendWifiMotionAlert(int rssi, int delta) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi dropped - reconnecting...");
    connectWiFi();
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"sensor_id\":\"";
  payload += sensorId;
  payload += "\",\"event\":\"wifi_motion_detected\",\"rssi\":";
  payload += String(rssi);
  payload += ",\"delta\":";
  payload += String(delta);
  payload += "}";

  unsigned long t0 = millis();
  int httpCode = http.POST(payload);
  unsigned long latency = millis() - t0;

  if (httpCode > 0) {
    Serial.print("  -> alert sent. HTTP ");
    Serial.print(httpCode);
    Serial.print("  latency=");
    Serial.print(latency);
    Serial.println(" ms");
  } else {
    Serial.print("  -> alert FAILED: ");
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
}

// -------------------- SETUP / LOOP --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=== WiFi-Only Motion Sensor booting ===");
  Serial.print("Sensor ID: ");
  Serial.println(sensorId);
  Serial.print("Server:    ");
  Serial.println(serverUrl);
  Serial.print("Threshold: ");
  Serial.print(RSSI_DELTA_THRESHOLD);
  Serial.println(" dBm");

  connectWiFi();

  Serial.println();
  Serial.println("Establishing baseline (stay still / leave the room)...");
}

void loop() {
  int rssi = WiFi.RSSI();

  // Phase 1: collect baseline samples.
  if (!baselineReady) {
    static int sampleCount = 0;
    static float sum = 0;
    sum += rssi;
    sampleCount++;
    if (sampleCount >= BASELINE_SAMPLES) {
      baselineRssi = sum / sampleCount;
      baselineReady = true;
      Serial.print("Baseline RSSI established: ");
      Serial.print(baselineRssi, 1);
      Serial.println(" dBm. Now watching for motion...");
    }
    delay(SAMPLE_INTERVAL_MS);
    return;
  }

  // Phase 2: detect deviations from baseline.
  int delta = abs(rssi - (int)baselineRssi);

  // Print every sample so you can watch the RSSI live.
  Serial.print("RSSI=");
  Serial.print(rssi);
  Serial.print(" dBm  baseline=");
  Serial.print(baselineRssi, 1);
  Serial.print("  delta=");
  Serial.print(delta);
  Serial.print(" dBm");

  if (delta >= RSSI_DELTA_THRESHOLD) {
    triggerStreak++;
    Serial.print("  [above threshold ");
    Serial.print(triggerStreak);
    Serial.print("/");
    Serial.print(CONSECUTIVE_TRIGGERS);
    Serial.print("]");
  } else {
    triggerStreak = 0;
  }
  Serial.println();

  if (triggerStreak >= CONSECUTIVE_TRIGGERS) {
    unsigned long now = millis();
    if (now - lastAlertTime >= COOLDOWN_MS) {
      Serial.println(">>> WIFI MOTION DETECTED <<<");
      sendWifiMotionAlert(rssi, delta);
      lastAlertTime = now;
    }
    triggerStreak = 0;
  }

  delay(SAMPLE_INTERVAL_MS);
}
