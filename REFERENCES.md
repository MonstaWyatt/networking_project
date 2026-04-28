# References & Documentation

Sources used or worth citing in the CNT 1510 project report.

---

## ESP-32 (Hardware & Firmware)

- **Espressif ESP32 Arduino Core**
  https://github.com/espressif/arduino-esp32
  Official ESP-32 Arduino board package. Ref for `WiFi.h`, `HTTPClient.h`.

- **ESP32 WiFi Library API Reference**
  https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html
  Documents `WiFi.begin()`, `WiFi.status()`, `WiFi.RSSI()`, `WiFi.localIP()`.

- **ESP32 HTTPClient API Reference**
  https://docs.espressif.com/projects/arduino-esp32/en/latest/api/httpclient.html
  Used for `http.POST(payload)` to send alerts.

- **ESP-WROOM-32 Datasheet (Espressif)**
  https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf
  Pinout, GPIO layout, electrical characteristics.

- **Silicon Labs CP210x USB-to-UART Drivers**
  https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers
  Required for Windows to recognize the ESP-32's USB port.

---

## PIR Sensor

- **HC-SR501 PIR Sensor Datasheet / Pinout**
  https://components101.com/sensors/hc-sr501-pir-sensor
  VCC / OUT / GND pinout, sensitivity + delay pots, retrigger jumper.

- **Adafruit PIR Tutorial (concepts)**
  https://learn.adafruit.com/pir-passive-infrared-proximity-motion-sensor
  Explains how pyroelectric motion detection works.

---

## Networking Concepts (core to CNT 1510)

- **IEEE 802.11 Standard Overview**
  https://standards.ieee.org/ieee/802.11/
  The WiFi spec the ESP-32 implements.

- **RFC 2616 — HTTP/1.1**
  https://www.rfc-editor.org/rfc/rfc2616
  The protocol used for the motion alert POSTs.

- **RFC 2131 — Dynamic Host Configuration Protocol (DHCP)**
  https://www.rfc-editor.org/rfc/rfc2131
  How the ESP-32 got its IP (10.0.0.148) automatically from the router.

- **MDN: HTTP request methods**
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
  Reference for POST vs GET (we use POST for alerts).

- **RSSI (Received Signal Strength Indicator) primer**
  https://en.wikipedia.org/wiki/Received_signal_strength_indication
  Used in WiFi reliability testing and the WiFi-only sensing demo.

---

## Server Side

- **Flask documentation**
  https://flask.palletsprojects.com/
  The Python web framework for the central server.

- **Flask Quickstart**
  https://flask.palletsprojects.com/en/latest/quickstart/
  Routing, request parsing, JSON responses.

---

## WiFi-Only Sensing (Nice Have)

- **Device-Free Wireless Sensing (survey)**
  https://ieeexplore.ieee.org/document/9127825
  Academic overview of using WiFi signal disturbance to detect presence.

- **Espressif CSI (Channel State Information) documentation**
  https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/wifi.html#channel-state-information
  ESP-32 support for CSI (beyond RSSI — future work direction).

- **IEEE 802.11bf — WLAN Sensing**
  https://standards.ieee.org/ieee/802.11bf/10400/
  Upcoming standard for WiFi-based sensing. Good citation to show the
  concept is being formally standardized.

---

## Tools Used

- **Arduino IDE 2.3.8** — https://www.arduino.cc/en/software
- **Python 3.12** — https://www.python.org/downloads/
- **Flask (Python package)** — installed via `pip install flask`
