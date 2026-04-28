TEST — Hello World
======================================================

GOAL:
Confirm that the Arduino IDE can compile and upload code to the ESP-32,
and that the Serial Monitor can read serial output from the board.

WHAT IT TESTS:
- Arduino IDE → ESP-32 upload pipeline
- CP210x USB-to-UART driver working
- Serial communication at 115200 baud

EXPECTED RESULT:
Serial Monitor shows:
  Hello from ESP-32!
  Still alive...
  Still alive...
  (repeating every 2 seconds)

ACTUAL RESULT:
PASS — upload succeeded on COM3, serial output displayed correctly at
115200 baud after fixing the default 9600 baud mismatch.

NOTES:
- Required installing CP210x Universal Windows Driver from Silicon Labs
  before Arduino IDE could see the board (see engineering_notebook Entry 1).
- Default Serial Monitor baud was 9600, had to be changed to 115200 to
  match Serial.begin() (see engineering_notebook Entry 2).
