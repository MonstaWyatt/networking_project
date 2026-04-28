// TEST 001 — Hello World
// Goal: Confirm Arduino IDE can compile, upload, and run code on the ESP-32,
//       and that the Serial Monitor receives output correctly.

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Hello from ESP-32!");
}

void loop() {
  Serial.println("Still alive...");
  delay(2000);
}
