TEST - WiFi Connection
======================================================

GOAL:
Confirm that the ESP-32 can connect to the local 2.4 GHz WiFi network
and maintain a stable connection over time. This satisfies Must Have #1.

WHAT IT TESTS:
- ESP-32 WiFi radio functionality
- Correct SSID and password configuration
- Connection stability over time (monitored via loop)
- Signal strength (RSSI) reporting

EXPECTED RESULT:
Serial Monitor shows:
  Connecting to WiFi: YOUR_WIFI_SSID
  .....
  WiFi connected!
  IP address: 192.168.X.XXX
  Signal strength (RSSI): -XX dBm
  Still connected. RSSI: -XX dBm
  (repeating every 10 seconds)

ACTUAL RESULT: PASS

  IP ADDRESS ASSIGNED:    10.0.0.148 (DHCP)
  RSSI (initial):         -59 dBm (good)
  RSSI (stable):          -58 to -59 dBm
  CONNECTION TIME:        ~6.5 seconds
  STAYED CONNECTED?:      Yes, across multiple loop iterations
  NOTES / ISSUES:         None - connected on first try

Raw serial output saved in results.txt.

RSSI REFERENCE:
  -30 to -50 dBm = excellent
  -50 to -60 dBm = good
  -60 to -70 dBm = fair
  -70 to -80 dBm = weak
  below -80 dBm  = unusable

NOTES:
- ESP-32 only supports 2.4 GHz WiFi, not 5 GHz. If the router broadcasts
  both bands under the same SSID, modern routers usually handle band
  selection automatically, but some may require a 2.4 GHz-specific SSID.
