WIFI-ONLY MOTION SENSING (Nice Have)
======================================================

PURPOSE:
Proof-of-concept that an ESP-32 can detect human motion using
WiFi signals alone - no PIR, no physical sensor. Works by
monitoring RSSI (received signal strength) to the router and
alerting when a sudden deviation from a known baseline is seen.

WHY IT WORKS:
A human body is mostly water, which absorbs and reflects 2.4 GHz
WiFi signals. When a person walks near the ESP-32 or between the
ESP-32 and the router, multipath propagation changes, and RSSI
wobbles by several dBm. Noisy but genuinely detectable.

HOW IT SATISFIES REQUIREMENTS:
- Nice Have: WiFi-only motion sensing proof-of-concept
- Demonstrates: RSSI measurement, baseline establishment,
  signal-processing thresholding, network alert transmission

HOW TO RUN:
1. Start the motion_server on the PC.
2. Upload this sketch to an ESP-32 (same or different board from
   the PIR one - change sensorId if running both).
3. Open Serial Monitor at 115200 baud.
4. Leave the area completely still for the 10-second baseline.
5. Walk around near the ESP-32 or between it and the router.
6. Watch Serial Monitor for "WIFI MOTION DETECTED" and the
   dashboard for a new alert tagged "wifi_motion_detected".

MULTI-NODE DEMO (with 2 ESP-32s):
- Flash one ESP-32 with sensorId = "wifi_sensor_1"
- Flash the second ESP-32 with sensorId = "wifi_sensor_2"
- Place them several feet apart
- Walk between them - at least one should detect the disturbance
- Dashboard shows which node(s) fired

CONFIG KNOBS:
- SAMPLE_INTERVAL_MS    - polling rate (default 100 ms = 10 Hz)
- BASELINE_SAMPLES      - how many samples for baseline (default 100)
- RSSI_DELTA_THRESHOLD  - dBm deviation that counts (default 4)
- CONSECUTIVE_TRIGGERS  - samples in a row needed (default 2)
- COOLDOWN_MS           - min ms between alerts (default 5000)

EXPECTED SERIAL OUTPUT:
    === WiFi-Only Motion Sensor booting ===
    Sensor ID: wifi_sensor_1
    Server:    http://10.0.0.113:5000/motion
    Threshold: 4 dBm
    Connecting to WiFi: YOUR_WIFI_SSID
    .....
    WiFi connected. IP: 10.0.0.149   baseline RSSI: -58 dBm
    Establishing baseline (stay still / leave the room)...
    Baseline RSSI established: -58.3 dBm. Now watching for motion...
    RSSI=-58 dBm  baseline=-58.3  delta=0 dBm
    RSSI=-57 dBm  baseline=-58.3  delta=1 dBm
    ...
    RSSI=-63 dBm  baseline=-58.3  delta=5 dBm  [above threshold 1/2]
    RSSI=-64 dBm  baseline=-58.3  delta=6 dBm  [above threshold 2/2]
    >>> WIFI MOTION DETECTED <<<
      -> alert sent. HTTP 200  latency=45 ms

LIMITATIONS (be honest in the report):
- Noisy: ambient WiFi traffic and other devices can trigger false
  positives. The 4 dBm threshold with a 2-sample streak is a
  compromise between sensitivity and noise tolerance.
- No localization: we can only say "something moved near this
  node." To estimate where, you'd need multiple nodes and more
  advanced signal processing (CSI, triangulation).
- Baseline drift: if the RF environment changes slowly (furniture
  moves, router load changes), the baseline may need re-running.
