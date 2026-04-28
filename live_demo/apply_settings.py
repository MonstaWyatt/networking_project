"""
apply_settings.py - read settings.json and patch the .ino sketches in place.

Run this whenever you change settings.json (e.g. switching to a different
hotspot or different PC) so the firmware constants match before you
upload to the ESP-32s.

Usage:
    cd live_demo
    python apply_settings.py
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent


def patch(path: Path, settings: dict) -> bool:
    """Patch one .ino file in place. Returns True if anything changed."""
    if not path.exists():
        print(f"  skip (not found): {path}")
        return False

    text = path.read_text(encoding="utf-8")
    original = text

    # ssid
    text = re.sub(
        r'(const char\*\s*ssid\s*=\s*")[^"]*(")',
        r'\g<1>' + settings["wifi"]["ssid"] + r'\g<2>',
        text,
    )
    # password
    text = re.sub(
        r'(const char\*\s*password\s*=\s*")[^"]*(")',
        r'\g<1>' + settings["wifi"]["password"] + r'\g<2>',
        text,
    )
    # serverUrl / serverUrlFallback (only present in tripwire.ino).
    # Match either variable name — the discovery-enabled version uses
    # 'serverUrlFallback' but earlier copies may use 'serverUrl'.
    text = re.sub(
        r'(const char\*\s*serverUrl(?:Fallback)?\s*=\s*"http://)[^:"]+(:\d+/motion")',
        r'\g<1>' + settings["server"]["ip"] + r'\g<2>',
        text,
    )
    port = str(settings["server"]["port"])
    text = re.sub(
        r'(const char\*\s*serverUrl(?:Fallback)?\s*=\s*"http://[^:"]+:)\d+(/motion")',
        r'\g<1>' + port + r'\g<2>',
        text,
    )

    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"  patched: {path.relative_to(HERE)}")
        return True
    print(f"  no change: {path.relative_to(HERE)}")
    return False


def main() -> int:
    cfg_path = HERE / "settings.json"
    if not cfg_path.exists():
        print(f"settings.json not found at {cfg_path}", file=sys.stderr)
        return 1

    settings = json.loads(cfg_path.read_text())
    print("Applying settings:")
    print(f"  ssid     = {settings['wifi']['ssid']}")
    print(f"  password = {settings['wifi']['password']}")
    print(f"  server   = {settings['server']['ip']}:{settings['server']['port']}")
    print()

    changed = 0
    for ino in [HERE / "beacon" / "beacon.ino", HERE / "tripwire" / "tripwire.ino"]:
        if patch(ino, settings):
            changed += 1

    print()
    print(f"Done. {changed} file(s) updated. Re-flash the ESP-32(s) for changes to take effect.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
