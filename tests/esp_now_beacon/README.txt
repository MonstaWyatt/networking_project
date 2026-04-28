ESP-NOW TRIPWIRE — BEACON
======================================================

ROLE:
Transmitter half of the peer-to-peer WiFi tripwire. Broadcasts a
small ESP-NOW packet 10 times per second. No server-side role —
it just emits signal the receiver can measure.

WHY ESP-NOW:
ESP-NOW is Espressif's connectionless wireless protocol. It lets
ESP-32s send frames directly to each other without a router in
the middle. This means we're measuring the signal path BETWEEN
the two boards — exactly where we want the tripwire to live.

WHY WE STILL JOIN WIFI:
The receiver needs to be on the home WiFi (to POST alerts to
the server). ESP-NOW has to run on the same radio channel as
whatever WiFi network the board is on. By having the beacon join
the same WiFi too, both boards are guaranteed to be on the same
channel automatically. (The beacon never actually sends HTTP.)

HOW TO FLASH:
1. Plug ONE ESP-32 into the PC via USB.
2. Open this sketch in Arduino IDE.
3. Upload.
4. Open Serial Monitor @ 115200 baud — you should see:
       === ESP-NOW Beacon booting ===
       WiFi connected.  channel=6  MAC=...
       Beacon ready. Broadcasting every 100 ms.
       seq=10  send=OK
       seq=20  send=OK
       ...

DEPLOY:
Power the beacon from a USB wall charger on one side of the
"tripwire line" (doorway, hallway, etc.). No USB-to-PC needed
once flashed.
