ESP-NOW TRIPWIRE — RECEIVER
======================================================

ROLE:
Receiver half of the peer-to-peer WiFi tripwire. Listens for
ESP-NOW broadcasts from the beacon board, measures the RSSI of
each received packet, and detects sudden RSSI deviations — which
happen when a body crosses the direct path between the two
boards. When the tripwire trips, it sends an HTTP POST to the
central server tagged as "tripwire_broken".

HOW IT WORKS:
1. Connect to WiFi (same network as the server) — this locks
   the radio channel that ESP-NOW uses.
2. Register an ESP-NOW receive callback.
3. First 100 received packets (~10 s) -> average to baseline RSSI.
4. From then on, each received packet is compared to baseline:
     - If RSSI deviates >=4 dBm for 2 packets in a row -> trigger.
     - A flag is set; loop() consumes it and sends the HTTP alert.
     - 5-second cooldown between alerts.

WHY DEFER THE ALERT TO loop():
The ESP-NOW callback runs in a constrained context. Network I/O
from there can starve the radio and drop subsequent packets. So
the callback just flips a flag; loop() does the HTTP work.

CONFIG KNOBS (top of sketch.ino):
  - RSSI_DELTA_THRESHOLD  (dBm)   — 4 is a good default
  - CONSECUTIVE_TRIGGERS          — 2 filters single-sample noise
  - BASELINE_SAMPLES              — 100 = 10 seconds of baseline
  - COOLDOWN_MS                   — 5000 (5s between alerts)

HOW TO FLASH:
1. Plug the OTHER ESP-32 into the PC via USB.
2. Open this sketch in Arduino IDE.
3. Upload.
4. Open Serial Monitor @ 115200 baud — you should see:
       === ESP-NOW Tripwire Receiver booting ===
       Sensor ID: tripwire_receiver
       Server:    http://10.0.0.113:5000/motion
       Connecting to WiFi....
       WiFi connected.  IP=10.0.0.XX  channel=6  MAC=...
       Waiting for beacon packets...
       Keep the path CLEAR for 10s while baseline calibrates.
       RSSI=-40 dBm  baseline=0.0  delta=0
       ...
       Baseline RSSI = -41.2 dBm. Tripwire armed.
       RSSI=-41 dBm  baseline=-41.2  delta=0
       ...
       >>> TRIPWIRE BROKEN <<<
         -> alert sent. HTTP 200  latency=38 ms

DEPLOY:
- Place the beacon and the receiver several feet apart with a
  clear line-of-sight between them (e.g., across a doorway).
- Power both from USB wall chargers.
- Watch the server dashboard — walking between the two boards
  should produce "tripwire_broken" alerts.

DEBUGGING:
- If you never see the "Baseline RSSI = ..." line, the receiver
  is not hearing any packets from the beacon:
    * Both boards on the same WiFi SSID? (channel must match)
    * Beacon serial says send=OK? (it's transmitting)
    * Try moving them closer together briefly.
- If RSSI numbers look frozen/stuck, the beacon may be crashed —
  reset it and watch for the "Beacon ready" line again.
