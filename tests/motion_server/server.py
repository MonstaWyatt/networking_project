"""
Motion Detection Server — CNT 1510 Final Project
=================================================
Receives HTTP POST alerts from ESP-32 motion sensors and logs them
with timestamps. Also serves a simple status page at "/" that shows
the most recent alerts.

Adds cross-sensor correlation: when two different sensors fire within
CORRELATION_WINDOW seconds of each other, a synthesized
"HIGH_CONFIDENCE_MOTION" event is logged alongside the raw alerts.

Run with:
    python server.py

The server listens on port 5000 and accepts connections from any IP
on the local network (so the ESP-32 can reach it over WiFi).
"""

from flask import Flask, request, jsonify, render_template_string
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# In-memory list of recent alerts (newest first).
# Also persisted to alerts.log for the project report.
alerts = []
LOG_FILE = "alerts.log"

# ---- Cross-sensor correlation ----
# If two DIFFERENT sensors fire within this window, it's treated as a
# high-confidence event (much less likely to be noise on a single node).
CORRELATION_WINDOW_SEC = 3.0

# Per-sensor "last seen" time for correlation (key = sensor_id).
last_seen = {}

# Cooldown for correlated events so we don't spam duplicates.
CORRELATION_COOLDOWN_SEC = 10.0
last_correlated_time = None


def write_log_line(line: str) -> None:
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def log_alert(sensor_id: str, event: str, extra: dict | None = None) -> dict:
    """Record one motion event with a timestamp."""
    now = datetime.now()
    timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "timestamp": timestamp_str,
        "sensor_id": sensor_id,
        "event": event,
        "source_ip": request.remote_addr if request else "server",
        "extra": extra or {},
    }
    alerts.insert(0, entry)

    extras_str = ""
    if extra:
        extras_str = " " + " ".join(f"{k}={v}" for k, v in extra.items())
    write_log_line(
        f"[{timestamp_str}] sensor={sensor_id} event={event} "
        f"from={entry['source_ip']}{extras_str}"
    )
    print(
        f"[{timestamp_str}] ALERT — sensor={sensor_id} event={event} "
        f"from={entry['source_ip']}{extras_str}"
    )
    return entry


def check_correlation(sensor_id: str) -> None:
    """If another sensor fired within the correlation window, log a
    synthesized HIGH_CONFIDENCE_MOTION event."""
    global last_correlated_time
    now = datetime.now()
    last_seen[sensor_id] = now

    # Any OTHER sensor seen within the window?
    for other_id, other_time in list(last_seen.items()):
        if other_id == sensor_id:
            continue
        if (now - other_time).total_seconds() <= CORRELATION_WINDOW_SEC:
            # Respect the correlation cooldown.
            if (
                last_correlated_time is not None
                and (now - last_correlated_time).total_seconds()
                < CORRELATION_COOLDOWN_SEC
            ):
                return
            last_correlated_time = now
            log_alert(
                sensor_id=f"{other_id}+{sensor_id}",
                event="HIGH_CONFIDENCE_MOTION",
                extra={"window_sec": CORRELATION_WINDOW_SEC},
            )
            return


@app.route("/motion", methods=["POST"])
def motion():
    """
    Endpoint the ESP-32 hits when it detects motion.
    Expects JSON like:
        {"sensor_id": "sensor_1", "event": "motion_detected"}
        {"sensor_id": "wifi_sensor_1", "event": "wifi_motion_detected",
         "rssi": -63, "delta": 5}
    Also tolerates form-encoded data.
    """
    sensor_id = "unknown"
    event = "motion_detected"
    extra: dict = {}

    if request.is_json:
        data = request.get_json(silent=True) or {}
        sensor_id = data.get("sensor_id", sensor_id)
        event = data.get("event", event)
        # Pass along any extra numeric fields (rssi, delta, etc).
        for key in ("rssi", "delta"):
            if key in data:
                extra[key] = data[key]
    else:
        sensor_id = request.form.get("sensor_id", sensor_id)
        event = request.form.get("event", event)

    entry = log_alert(sensor_id, event, extra)
    check_correlation(sensor_id)
    return jsonify({"status": "ok", "logged": entry}), 200


@app.route("/")
def status_page():
    """Simple status page listing recent alerts."""
    template = """
    <!doctype html>
    <html>
    <head>
      <title>Motion Detection Server</title>
      <meta http-equiv="refresh" content="5">
      <style>
        body { font-family: sans-serif; max-width: 950px; margin: 2em auto; padding: 0 1em; }
        h1 { color: #2c3e50; }
        .meta { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 1em; }
        th, td { text-align: left; padding: 0.5em 1em; border-bottom: 1px solid #ddd; }
        th { background: #f4f6f8; }
        tr.high td { background: #fff4d6; font-weight: bold; color: #a34700; }
        tr.wifi td { background: #eaf4ff; }
        tr.pir  td { background: #f4fff0; }
        .empty { color: #888; font-style: italic; margin-top: 1em; }
        .legend span { display: inline-block; padding: 2px 8px; margin-right: 8px; border-radius: 4px; font-size: 0.85em; }
        .lg-high { background: #fff4d6; color: #a34700; }
        .lg-wifi { background: #eaf4ff; color: #1a4e8a; }
        .lg-pir  { background: #f4fff0; color: #2a6f1a; }
      </style>
    </head>
    <body>
      <h1>Motion Detection Server</h1>
      <p class="meta">Listening on port 5000 &middot; auto-refresh every 5s
         &middot; correlation window: {{ win }}s</p>
      <p>Total alerts received: <b>{{ count }}</b></p>
      <p class="legend">
        <span class="lg-pir">PIR / button motion</span>
        <span class="lg-wifi">WiFi RSSI motion</span>
        <span class="lg-high">HIGH-CONFIDENCE (cross-correlated)</span>
      </p>
      {% if alerts %}
      <table>
        <tr><th>Timestamp</th><th>Sensor</th><th>Event</th><th>Source IP</th><th>Extra</th></tr>
        {% for a in alerts %}
        <tr class="{% if a.event == 'HIGH_CONFIDENCE_MOTION' %}high{% elif 'wifi' in a.event %}wifi{% else %}pir{% endif %}">
          <td>{{ a.timestamp }}</td>
          <td>{{ a.sensor_id }}</td>
          <td>{{ a.event }}</td>
          <td>{{ a.source_ip }}</td>
          <td>{% for k, v in a.extra.items() %}{{ k }}={{ v }} {% endfor %}</td>
        </tr>
        {% endfor %}
      </table>
      {% else %}
      <p class="empty">No alerts yet. Waiting for motion events&hellip;</p>
      {% endif %}
    </body>
    </html>
    """
    return render_template_string(
        template, alerts=alerts[:80], count=len(alerts), win=CORRELATION_WINDOW_SEC
    )


if __name__ == "__main__":
    print("=" * 60)
    print("Motion Detection Server starting...")
    print(f"Log file: {os.path.abspath(LOG_FILE)}")
    print("Listening on 0.0.0.0:5000 (reachable from local network)")
    print("Status page: http://<your-pc-ip>:5000/")
    print("Alert endpoint: POST http://<your-pc-ip>:5000/motion")
    print(f"Correlation window: {CORRELATION_WINDOW_SEC}s  "
          f"cooldown: {CORRELATION_COOLDOWN_SEC}s")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False)
