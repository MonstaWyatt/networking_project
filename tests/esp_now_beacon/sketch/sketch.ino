// ESP-NOW TRIPWIRE - BEACON (Transmitter)
// =====================================================
// Flash this onto ONE ESP-32. It broadcasts a small ESP-NOW
// packet 10 times per second. The companion "tripwire" ESP-32
// receives these packets and measures their RSSI to detect
// motion in the direct path between the two boards.
//
// It joins the home WiFi only so that ESP-NOW ends up on the
// same radio channel as the receiver (which stays on the
// router's channel to also send HTTP alerts).

#include <WiFi.h>
#include <esp_now.h>

// -------------------- CONFIG --------------------
const char* ssid     = "whyit";
const char* password = "whyit12345";

// Broadcast address - the beacon doesn't need to know the
// receiver's MAC. All ESP-NOW-enabled boards on the same
// channel will hear us.
uint8_t broadcastAddr[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

const unsigned long BROADCAST_INTERVAL_MS = 100;   // 10 Hz

// -------------------- STATE --------------------
unsigned long seq = 0;

struct __attribute__((packed)) Payload {
  uint32_t seq;
  uint32_t tx_ms;
};

// -------------------- SETUP --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=== ESP-NOW Beacon booting ===");

  // Station mode is required for ESP-NOW.
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected.  channel=");
  Serial.print(WiFi.channel());
  Serial.print("  MAC=");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init FAILED - halting.");
    while (true) { delay(1000); }
  }

  // Register the broadcast peer (needed before esp_now_send).
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, broadcastAddr, 6);
  peer.channel = 0;       // follow current station channel
  peer.encrypt = false;
  if (esp_now_add_peer(&peer) != ESP_OK) {
    Serial.println("Failed to add broadcast peer.");
    while (true) { delay(1000); }
  }

  Serial.println("Beacon ready. Broadcasting every 100 ms.");
}

// -------------------- LOOP --------------------
void loop() {
  Payload p;
  p.seq   = ++seq;
  p.tx_ms = millis();

  esp_err_t result = esp_now_send(
      broadcastAddr, reinterpret_cast<uint8_t*>(&p), sizeof(p)
  );

  // Keep the serial output readable - print once per second.
  if (seq % 10 == 0) {
    Serial.print("seq=");
    Serial.print(seq);
    Serial.print("  send=");
    Serial.println(result == ESP_OK ? "OK" : "FAIL");
  }

  delay(BROADCAST_INTERVAL_MS);
}
