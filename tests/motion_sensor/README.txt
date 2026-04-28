MOTION SENSOR FIRMWARE
======================================================

PURPOSE:
ESP-32 firmware that reads a motion input (PIR sensor in the final
version, ESP-32 BOOT button while testing) and sends an HTTP POST
alert to the central server over WiFi.

HOW IT SATISFIES REQUIREMENTS:
- Must Have #1: Connects to WiFi and maintains connection
- Must Have #2: Reads a digital input pin for motion signal
- Must Have #3: Sends HTTP POST alert over the network on motion
- Must Have #4: Server receives and logs the event with timestamp
- Must Have #5: Print-based signal transmission/reception docs
- Should Have:  Includes cooldown logic to prevent duplicate alerts
- Should Have:  sensor_id field lets the server distinguish rooms

CONFIG (at the top of sketch.ino):
- USE_BOOT_BUTTON_FOR_TESTING - true for button test, false for PIR
- ssid / password              - WiFi credentials
- serverUrl                    - PC's LAN IP + Flask port
- sensorId                     - unique ID for this board
- COOLDOWN_MS                  - minimum ms between alerts

WIRING (when USE_BOOT_BUTTON_FOR_TESTING = false):
- PIR VCC -> ESP-32 3V3
- PIR GND -> ESP-32 GND
- PIR OUT -> ESP-32 D15 (GPIO 15)

HOW TO TEST:
1. Start the motion_server (python server.py) on your PC.
2. Upload this sketch to the ESP-32.
3. Open Serial Monitor at 115200 baud.
4. Press the BOOT button on the ESP-32 (or trigger the PIR).
5. Watch for ">>> MOTION DETECTED <<<" and "Alert sent. HTTP 200".
6. Refresh the server dashboard to see the alert appear in the table.

EXPECTED SERIAL OUTPUT:
    === Motion Sensor booting ===
    Input pin: GPIO 0
    Active state: LOW
    Server: http://10.0.0.113:5000/motion
    Connecting to WiFi: YOUR_WIFI_SSID
    ....
    WiFi connected. IP: 10.0.0.148   RSSI: -59 dBm
    Ready. Waiting for motion...
    >>> MOTION DETECTED <<<
    Alert sent. HTTP 200  latency=42 ms
