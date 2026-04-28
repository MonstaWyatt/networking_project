# School-Computer Setup Guide

**Goal:** get the live demo running on a fresh Windows PC in ~15 minutes.

Pull this file up on your phone for reference while you set up.

---

## What you need to bring

- Both ESP-32 boards (already flashed with `whyit` / `whyit12345` / `172.20.10.2`)
- 2x USB micro cables for power
- 2x USB chargers OR access to USB ports on the school PC
- Phone with hotspot named `whyit`, password `whyit12345`, **2.4 GHz mode on**
- This GitHub repo URL: `https://github.com/MonstaWyatt/networking_project`

---

## Step 1. Install Python

Already installed?
```powershell
python --version
```

If `Python 3.10` or higher → skip to Step 2.

If not installed → go to **python.org/downloads**, get the latest 3.x, run the
installer. **Tick "Add python.exe to PATH"** at the bottom of the install screen.
Then re-open PowerShell and confirm `python --version` works.

---

## Step 2. Turn on your phone hotspot

- iPhone: Settings → Personal Hotspot → ON. Confirm "Maximize Compatibility" is ON.
- Android: Settings → Hotspot → AP Band → 2.4 GHz → ON.

SSID: `whyit`  Password: `whyit12345`

## Step 3. Connect the school PC to `whyit`

WiFi menu → `whyit` → password `whyit12345` → Connect.

Open PowerShell, verify the IP:
```powershell
ipconfig
```
Find `Wireless LAN adapter Wi-Fi` → `IPv4 Address`.

- If it shows `172.20.10.2` → continue to Step 4.
- If it shows anything else (e.g. `172.20.10.5`) → write that number down.
  You'll fix it in Step 7 after cloning the repo.

---

## Step 4. Set the network to Private (so the firewall lets traffic in)

```powershell
Get-NetConnectionProfile
```

Find the entry whose Name starts with `whyit` (might be `whyit 2`).
Note its exact name. Then run, replacing `<NAME>` with that exact name:

```powershell
Set-NetConnectionProfile -Name "<NAME>" -NetworkCategory Private
```

Example if the name is `whyit`:
```powershell
Set-NetConnectionProfile -Name "whyit" -NetworkCategory Private
```

## Step 5. Add the firewall rule (allows ESP-32 to reach the server)

**Right-click PowerShell -> Run as administrator**, then:

```powershell
New-NetFirewallRule -DisplayName "Flask Motion Server" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Any
```

Output should end with `Enabled : True`. Close the admin PowerShell.

If you don't have admin rights, the demo cannot work on this PC. Tell
the professor before continuing.

---

## Step 6. Clone the project from GitHub

In a regular PowerShell:

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/MonstaWyatt/networking_project.git
cd networking_project
```

If `git` isn't installed: download the project as a ZIP from GitHub
(green Code button -> Download ZIP), unzip it to Desktop, then:
```powershell
cd $env:USERPROFILE\Desktop\networking_project
```

## Step 7. (Only needed if auto-discovery fails)

**Good news:** the tripwire firmware now auto-discovers the server on
the local subnet, so you do NOT need to reflash if the school PC has a
different IP. On boot, the receiver scans `172.20.10.1`-`172.20.10.14`
(the iPhone hotspot subnet) and POSTs to whichever address has a Flask
server listening on port 5000.

You can confirm it found the server by watching the receiver's Serial
Monitor for a line like:
```
Server resolved to: http://172.20.10.5:5000/motion
```

**If discovery fails** (rare — usually means the firewall isn't open
yet or the server isn't running), update the fallback URL manually:

1. Make sure `python server.py` is running and the firewall rule is set.
2. Reset the tripwire (EN/RESET button) so it scans again.

Only if rescanning still fails:

1. Open `live_demo\settings.json` in Notepad.
2. Change `"ip": "172.20.10.2"` to the real IP from `ipconfig`.
3. Save.
4. `cd live_demo && python apply_settings.py`
5. Re-flash the tripwire ESP-32 with Arduino IDE.

---

## Step 8. Install Flask and start the server

```powershell
pip install flask
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

**Leave this PowerShell window open** during the demo. Closing it kills
the server.

## Step 9. Open the dashboard

Open Chrome / Edge / Firefox and go to:
```
http://172.20.10.2:5000/
```

(Replace with your actual IP if Step 3 showed something different.)

You should see "Motion Detection Server" with a "No alerts yet" message.

---

## Step 10. Power up the ESP-32s

Plug both ESP-32s into USB power (chargers, power banks, or PC USB ports).

The receiver's red LED should light up, and within ~5 seconds it'll join
`whyit` and start measuring RSSI from the beacon.

Place the two boards 6+ feet apart with line-of-sight between them.

## Step 11. Test before the prof walks in

Walk between the two boards once. Within ~5 seconds the dashboard should
flash a `tripwire_broken` row.

If it does → you're ready. If not, see "Troubleshooting" below.

---

## Troubleshooting cheat sheet

| Symptom | Fix |
|---|---|
| Dashboard shows alerts when I walk → demo works! | Nothing. Don't touch anything. |
| `ipconfig` shows different IP than 172.20.10.2 | Step 7 — edit settings.json, run apply_settings.py, reflash tripwire. |
| ESP-32 Serial Monitor shows `HTTP -1 latency=5002 ms` | Network category is still Public, OR firewall rule missing. Redo Steps 4 and 5. |
| Phone can't load `http://<PC_IP>:5000/` | Same as above — firewall blocking. |
| ESP-32 stuck on `Connecting to WiFi:` forever | Hotspot is in 5 GHz mode. Switch to 2.4 GHz on the phone. |
| `pip install flask` fails | Try `python -m pip install flask` |
| `git clone` not recognized | Download ZIP from the green "Code" button on GitHub instead. |
| No admin rights on the PC | Demo can't run on this PC. Talk to the prof. |

---

## What to say if anything goes sideways during the demo

If the live system fails despite working in rehearsal, fall back to the
slide deck (`presentation.pptx`):
- Slide 9 has a screenshot of the dashboard working
- Slide 12 explains the architecture
- The speaker notes have full details on the close-range RSSI and
  adaptive baseline issues

This is also a great moment to mention real-world IoT engineering:
networks change, firewalls drop packets, things go wrong on demo day.
Acknowledge it, walk through the architecture from the slides, take
questions.
