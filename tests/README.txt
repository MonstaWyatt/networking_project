TESTS & SKETCHES — ESP-32 Motion Detection System
======================================================

Every sketch lives in its own named folder. The same naming scheme is
used for exploratory tests AND final program components — just descriptive
names, no numbered prefix.

Each folder contains:
  - sketch.ino       — the Arduino code
  - README.txt       — goal, what it tests/does, expected vs actual result
  - results.txt      — raw serial output / observations (optional)


INDEX
------------------------------------------------------
TESTS (exploratory — confirm each piece works):
  hello_world/        — Confirm ESP-32 runs code and prints to serial
  wifi_connection/    — Confirm ESP-32 connects to WiFi (Must Have #1)
  pir_detection/      — (planned) Confirm PIR sensor triggers GPIO
  http_alert/         — (planned) Send an HTTP POST to the server
  range_test/         — (planned) Measure RSSI at distance / through walls

FINAL PROGRAMS (the actual system):
  motion_sensor/      — Full ESP-32 firmware: PIR + WiFi + HTTP
  motion_server/      — Central server that logs alerts
  wifi_sensing/       — Nice Have: single-node WiFi-only motion via RSSI
  esp_now_beacon/     — Nice Have: tripwire transmitter (ESP-NOW)
  esp_now_tripwire/   — Nice Have: tripwire receiver (ESP-NOW + HTTP alert)
