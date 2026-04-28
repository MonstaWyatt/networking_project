// TEST 002 - WiFi Connection
// Goal: Confirm ESP-32 can connect to the local WiFi network and
//       maintain a stable connection. Satisfies Must Have #1.

#include <WiFi.h>

const char* ssid     = "whyit";
const char* password = "whyit12345";

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Still connected. RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WiFi disconnected!");
  }
  delay(10000);
}
