// MOTION SENSOR - CNT 1510 Wireless Networking Final Project
// =====================================================
// Reads a digital input (PIR sensor or BOOT button for testing),
// and sends an HTTP POST alert to the central server over WiFi
// whenever motion is detected.
//
// Covers Must Haves #1, #2, #3, #4, #5 and Should Have cooldown logic.

#include <WiFi.h>
#include <HTTPClient.h>

// -------------------- CONFIG --------------------
// Set to true while testing with the ESP-32 BOOT button (GPIO 0).
// Set to false once the real PIR sensor is wired up on D15.
#define USE_BOOT_BUTTON_FOR_TESTING  true

// WiFi credentials
const char* ssid     = "whyit";
const char* password = "whyit12345";

// Server endpoint - your PC's LAN IP + Flask port.
const char* serverUrl = "http://YOUR_SERVER_IP:5000/motion";

// Unique identifier for THIS sensor. Change it per board so the
// server can tell which room the alert came from.
const char* sensorId  = "sensor_1";

// Cooldown (milliseconds) between alerts from a single motion event.
// Prevents spamming the server on a long-lasting trigger.
const unsigned long COOLDOWN_MS = 5000;   // 5 seconds

// -------------------- PINS --------------------
#if USE_BOOT_BUTTON_FOR_TESTING
  const int MOTION_PIN   = 0;        // GPIO 0 = BOOT button
  const int ACTIVE_STATE = LOW;      // BOOT button reads LOW when pressed
  const int PIN_MODE     = INPUT_PULLUP;
#else
  const int MOTION_PIN   = 15;       // GPIO 15 = PIR OUT wired to D15
  const int ACTIVE_STATE = HIGH;     // PIR reads HIGH when motion detected
  const int PIN_MODE     = INPUT;
#endif

// -------------------- STATE --------------------
unsigned long lastAlertTime = 0;
int lastPinState = -1;

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
  Serial.print("   RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void sendMotionAlert() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - reconnecting...");
    connectWiFi();
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"sensor_id\":\"";
  payload += sensorId;
  payload += "\",\"event\":\"motion_detected\"}";

  unsigned long t0 = millis();
  int httpCode = http.POST(payload);
  unsigned long latency = millis() - t0;

  if (httpCode > 0) {
    Serial.print("Alert sent. HTTP ");
    Serial.print(httpCode);
    Serial.print("  latency=");
    Serial.print(latency);
    Serial.println(" ms");
  } else {
    Serial.print("Alert FAILED: ");
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
}

// -------------------- SETUP / LOOP --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=== Motion Sensor booting ===");
  Serial.print("Input pin: GPIO ");
  Serial.println(MOTION_PIN);
  Serial.print("Active state: ");
  Serial.println(ACTIVE_STATE == HIGH ? "HIGH" : "LOW");
  Serial.print("Server: ");
  Serial.println(serverUrl);

  pinMode(MOTION_PIN, PIN_MODE);
  connectWiFi();

  Serial.println("Ready. Waiting for motion...");
}

void loop() {
  int pinState = digitalRead(MOTION_PIN);

  // Edge-detect: only fire on transition into the active state.
  if (pinState == ACTIVE_STATE && lastPinState != ACTIVE_STATE) {
    unsigned long now = millis();
    if (now - lastAlertTime >= COOLDOWN_MS) {
      Serial.println(">>> MOTION DETECTED <<<");
      sendMotionAlert();
      lastAlertTime = now;
    } else {
      Serial.println("(motion within cooldown - ignored)");
    }
  }

  lastPinState = pinState;
  delay(50);   // debounce / polling interval
}
