# Live Demo - ESP-NOW Tripwire

Self-contained kit for the in-class demo. Everything is pre-configured for
the **whyit** hotspot and PC IP `172.20.10.2`.

```
live_demo/
  README.md          - this file
  settings.json      - single source of truth (WiFi creds, server IP/port)
  apply_settings.py  - patches the .ino files from settings.json
  server.py          - Flask server (run on the PC)
  beacon/
    beacon.ino       - ESP-NOW transmitter sketch
  tripwire/
    tripwire.ino     - ESP-NOW receiver + HTTP alert sketch
```

---

## What you need installed on the demo PC

| Required | Why |
|---|---|
| **Python 3.10+** (3.12 confirmed working) | Runs `server.py` and `apply_settings.py`. Get from python.org. |
| **Flask** | The web framework for `server.py`. Install with `pip install flask`. |
| A modern web browser | To view the dashboard at `http://172.20.10.2:5000/`. |

**Only needed if you flash the ESP-32s on the demo PC** (i.e. didn't already
flash them at home):

| Required | Why |
|---|---|
| Arduino IDE 2.x | To upload the sketches to the ESP-32s. |
| ESP32 board package (Espressif) | Adds `ESP32 Dev Module` as a board option. |
| Silicon Labs CP210x VCP driver | Lets Windows recognize the ESP-32 over USB. |
| 1 USB micro data cable | For programming. |

**Always needed (hardware):**
- 2 ESP-32 boards (already flashed if possible)
- 2 USB micro power sources (wall chargers, power banks, or USB ports)
- Phone with hotspot capability

If you're using the same PC you built the project on, everything is
already installed. Just bring the boards.

---

## Customizing settings (use this if anything changes)

If you switch to a different hotspot, change PC IP, or want to rename
sensors, edit `settings.json`:

```json
{
  "wifi":   { "ssid": "...", "password": "..." },
  "server": { "ip": "172.20.10.2", "port": 5000 }
}
```

Then run:
```
python apply_settings.py
```

This rewrites the `ssid`, `password`, and `serverUrl` constants in both
`beacon/beacon.ino` and `tripwire/tripwire.ino`. **Re-flash both boards**
for the changes to take effect.

---

## Pre-demo checklist (do this BEFORE class)

1. Phone hotspot `whyit` is set up with password `whyit12345`. 2.4 GHz mode.
2. PC has joined the hotspot. Confirm IP is `172.20.10.2` with `ipconfig`.
   - **If the PC's IP is different**, update `settings.json`, run
     `python apply_settings.py`, and re-flash the tripwire board.
3. Both ESP-32s flashed (steps below) and powered via USB chargers.
4. Flask server runs without error on the PC.
5. Dashboard loads in browser at `http://172.20.10.2:5000/`.
6. Walk between the two boards once - tripwire fires, dashboard logs it.

If 1-6 all work, you're ready.

---

## Flashing the ESP-32s (one-time, before the demo)

### Beacon (ESP-32 #1)

1. Plug ESP-32 #1 into the PC via USB.
2. Open `live_demo/beacon/beacon.ino` in Arduino IDE 2.x.
3. **Tools -> Board -> ESP32 Dev Module**.
4. **Tools -> Port** -> select the COM port the board enumerated on.
5. Click Upload.
6. Open Serial Monitor at 115200 baud. Confirm:
   ```
   === ESP-NOW Beacon booting ===
   WiFi connected.  channel=...
   Beacon ready. Broadcasting every 100 ms.
   ```
7. Unplug. Power via wall charger and place on one side of the demo area.

### Tripwire receiver (ESP-32 #2)

1. Plug ESP-32 #2 into the PC via USB.
2. Open `live_demo/tripwire/tripwire.ino` in Arduino IDE 2.x.
3. Same Board / Port settings.
4. Click Upload.
5. Open Serial Monitor at 115200 baud. Confirm:
   ```
   === ESP-NOW Tripwire Receiver booting ===
   WiFi connected.  IP=172.20.10.X  channel=...
   Waiting for beacon packets...
   ...
   Baseline RSSI = -XX.X dBm. Tripwire armed.
   ```
6. Unplug. Power via a second wall charger and place on the OPPOSITE side
   of the demo area. **Aim the two boards roughly at each other** with
   line-of-sight between them.

---

## Demo-day order of operations

1. **Turn on the hotspot** on your phone. Confirm `whyit` is broadcasting.
2. **Connect your PC** to the hotspot.
3. **Verify PC IP**: open PowerShell, run `ipconfig`. Confirm `172.20.10.2`.
   If different, you must edit and re-flash the tripwire sketch.
4. **Power up both ESP-32s** (USB chargers). Red LEDs on both boards.
5. **Start the server** on the PC. Open PowerShell in the project root:
   ```powershell
   cd live_demo
   python server.py
   ```
   You should see:
   ```
   ============================================================
   Motion Detection Server starting...
   Listening on 0.0.0.0:5000 (reachable from local network)
   ...
    * Running on http://172.20.10.2:5000
   ```
6. **Open the dashboard** in a browser: `http://172.20.10.2:5000/`
7. **Wait ~10 seconds** so the tripwire's adaptive baseline calibrates.
8. **Walk between the two boards.** The dashboard updates within ~5 seconds
   with a `tripwire_broken` row showing the RSSI delta.

---

## Quick troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Dashboard shows no events ever | Server not started, or wrong IP in tripwire sketch. Check `ipconfig` again. |
| Tripwire fires constantly with no one near it | Boards too close (RSSI saturated). Move them several feet apart. |
| `Baseline RSSI = ...` never prints in Serial | Receiver isn't hearing the beacon. Make sure both boards joined `whyit` (same WiFi channel). Reset both boards. |
| Browser shows "site can't be reached" | Phone, PC, and ESP-32s must all be on the **same hotspot** network. |
| ESP-32 keeps restarting | Underpowered USB charger. Try a different cable / charger. |

---

## What the demo actually shows

- **Peer-to-peer wireless (ESP-NOW)** between the two ESP-32s, with no
  router involved in the sensor-to-sensor link.
- **Adaptive RSSI baseline (EMA)** that self-recalibrates if the
  environment shifts.
- **Real-time HTTP alerts over WiFi** from the receiver to the Flask
  server on the PC, all running on the phone hotspot LAN.
- **Live web dashboard** that updates within seconds of motion.
