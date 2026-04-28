MOTION SERVER
======================================================

PURPOSE:
Receives HTTP POST motion alerts from ESP-32 sensors over the local
WiFi network and logs them with timestamps. Also serves a simple
web dashboard at "/" showing the most recent alerts.

HOW IT SATISFIES REQUIREMENTS:
- Must Have #3: ESP-32 transmits a motion alert (HTTP) over the network
- Must Have #4: Central server receives and logs motion events with timestamps
- Must Have #5: Basic signal transmission between ESP-32 and server
- Should Have:  Differentiate which sensor triggered the alert (via sensor_id)
- Nice to Have: Live web dashboard at http://<pc-ip>:5000/

HOW TO RUN:
1. Install Flask (one time only):
       pip install flask

2. From this folder, run:
       python server.py

3. The terminal prints the server status. Leave this window open —
   closing it stops the server.

4. In a browser, go to http://localhost:5000/ to see the dashboard.
   (From the ESP-32 side, use the PC's LAN IP, not localhost.)

ENDPOINTS:
- GET  /          — dashboard showing recent alerts
- POST /motion    — ESP-32 posts here when motion is detected
                    body: {"sensor_id": "sensor_1", "event": "motion_detected"}

FILES:
- server.py       — the Flask server
- alerts.log      — append-only log of every alert (created at runtime)
- README.txt      — this file
