# ESP-32 Motion Detection System

Final project for **CNT 1510 (Wireless Networking)**. A small distributed
wireless sensor network: ESP-32 nodes detect motion (PIR, button, or pure
WiFi RSSI) and send HTTP alerts over the LAN to a Flask server with a
live web dashboard. A bonus mode uses ESP-NOW peer-to-peer to build a
direct WiFi tripwire between two boards.

## What's in the box

| Folder | What it is |
|---|---|
| `tests/hello_world/` | First-light sketch: prove the upload toolchain works |
| `tests/wifi_connection/` | ESP-32 joins WiFi, prints IP and RSSI |
| `tests/motion_sensor/` | PIR (or BOOT button) GPIO -> HTTP POST alert |
| `tests/motion_server/` | Flask server: receives alerts, logs them, live dashboard |
| `tests/wifi_sensing/` | Detect motion using *only* WiFi RSSI fluctuations |
| `tests/esp_now_beacon/` | Tripwire transmitter (ESP-NOW) |
| `tests/esp_now_tripwire/` | Tripwire receiver: measures direct RSSI, fires HTTP alert |

## Running it

### 1. Server (on a PC)

```bash
pip install flask
python tests/motion_server/server.py
```

Server listens on `0.0.0.0:5000`. Open `http://<your-pc-ip>:5000/` in a
browser to watch alerts in real time.

### 2. Firmware (on the ESP-32s)

Open any of the sketches in Arduino IDE 2.x with the ESP-32 Arduino
core installed. At the top of each sketch, fill in:

```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:5000/motion";
```

Select `ESP32 Dev Module`, the correct COM port, and Upload.

## Networking concepts demonstrated

- IEEE 802.11 WiFi (2.4 GHz)
- DHCP (auto IP assignment)
- TCP / HTTP (JSON POST alerts)
- Client-server (many sensors, one aggregator)
- ESP-NOW (peer-to-peer wireless, bypasses router)
- Cross-sensor correlation (time-windowed event fusion on the server)
- Adaptive baseline / Exponential Moving Average

See `REFERENCES.md` for citations and `engineering_notebook.txt` for the
build log.

## License

Built for an academic project. Use freely.
