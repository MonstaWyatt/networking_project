// Build the CNT 1510 final-project slide deck.
// Run: node build_slides.js

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaWifi, FaServer, FaMicrochip, FaNetworkWired, FaCheckCircle,
  FaBroadcastTower, FaShieldAlt, FaCodeBranch, FaCogs, FaTools,
  FaChartLine, FaRocket, FaBolt, FaProjectDiagram, FaBug,
  FaSatelliteDish, FaMobileAlt, FaDatabase, FaRegLightbulb,
  FaLink, FaArrowRight, FaQuestionCircle, FaCrosshairs,
} = require("react-icons/fa");

// ---------- palette ----------
const C = {
  primary:    "065A82",   // deep blue
  secondary:  "1C7293",   // teal
  dark:       "21295C",   // midnight
  darker:     "10162E",   // deeper midnight (title/closing bg)
  lightBg:    "F8FAFC",   // off-white slide bg
  text:       "1E293B",   // dark slate (body text)
  muted:      "64748B",   // muted slate (captions)
  success:    "10B981",   // green checkmarks
  accent:     "38BDF8",   // sky-blue accent
  warn:       "F59E0B",   // amber
  soft:       "CBD5E1",   // pale slate for dividers / subtle fills
};

// ---------- helpers ----------
function renderIconSvg(IconComponent, color = "#FFFFFF", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function iconPng(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64, " + buf.toString("base64");
}

// Colored circle + icon. x, y are TOP-LEFT of the circle (inches).
async function drawIconBadge(slide, IconComponent, x, y, d = 0.55, bg = C.secondary) {
  slide.addShape("ellipse", {
    x, y, w: d, h: d,
    fill: { color: bg }, line: { color: bg, width: 0 },
  });
  const pad = 0.13;
  const iconData = await iconPng(IconComponent, "#FFFFFF", 256);
  slide.addImage({
    data: iconData,
    x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2,
  });
}

// Standard slide title (left-aligned), returns y-of-next-row (inches).
function drawTitle(slide, text, xStart = 1.3, y = 0.35) {
  slide.addText(text, {
    x: xStart, y, w: 10 - xStart - 0.3, h: 0.6,
    fontSize: 28, fontFace: "Calibri", bold: true, color: C.primary,
    margin: 0, valign: "middle",
  });
  return y + 0.7;
}

// Light light-bg setup for content slides.
function newContentSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  // Footer bar (thin)
  s.addShape("rect", {
    x: 0, y: 5.5, w: 10, h: 0.125,
    fill: { color: C.secondary }, line: { color: C.secondary, width: 0 },
  });
  s.addText("ESP-32 Motion Detection  •  CNT 1510  •  Wyatt Halvorson", {
    x: 0.4, y: 5.32, w: 9.2, h: 0.18,
    fontSize: 9, fontFace: "Calibri", color: C.muted, align: "left",
  });
  return s;
}

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";   // 10 x 5.625
  pres.title  = "ESP-32 Motion Detection System";
  pres.author = "Wyatt Halvorson";

  // ===================================================================
  // SLIDE 1, Title
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.darker };

    // Faint geometric motif: concentric "signal" rings on right side.
    const cx = 8.2, cy = 2.8;
    for (const [r, t] of [[2.4, 88], [1.8, 82], [1.2, 74], [0.7, 60]]) {
      s.addShape("ellipse", {
        x: cx - r, y: cy - r, w: r * 2, h: r * 2,
        fill: { color: C.darker }, // transparent inside
        line: { color: C.secondary, width: 1, transparency: t },
      });
    }
    // Central "node" dot
    s.addShape("ellipse", {
      x: cx - 0.15, y: cy - 0.15, w: 0.3, h: 0.3,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });

    // Title block (left side)
    s.addText("ESP-32", {
      x: 0.7, y: 1.2, w: 7, h: 0.7,
      fontSize: 44, fontFace: "Calibri", bold: true, color: C.accent,
      margin: 0,
    });
    s.addText("Motion Detection System", {
      x: 0.7, y: 1.8, w: 7, h: 0.9,
      fontSize: 40, fontFace: "Calibri", bold: true, color: "FFFFFF",
      margin: 0,
    });
    s.addText("A distributed wireless sensor network over WiFi + ESP-NOW", {
      x: 0.7, y: 2.9, w: 7, h: 0.5,
      fontSize: 18, fontFace: "Calibri", italic: true, color: "CBD5E1",
      margin: 0,
    });

    // Footer row
    s.addShape("rect", {
      x: 0.7, y: 4.3, w: 0.08, h: 0.7,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
    s.addText([
      { text: "CNT 1510 Wireless Networking", options: { breakLine: true, bold: true, color: "FFFFFF", fontSize: 14 } },
      { text: "Final Project  •  Wyatt Halvorson  •  April 2026", options: { color: "CBD5E1", fontSize: 12 } },
    ], {
      x: 0.95, y: 4.3, w: 6, h: 0.8, fontFace: "Calibri", margin: 0, valign: "top",
    });
  }

  // ===================================================================
  // SLIDE 2, What & Why
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaRegLightbulb, 0.5, 0.35, 0.55);
    drawTitle(s, "The Project");

    // Quote card (full-width)
    s.addShape("rect", {
      x: 0.5, y: 1.3, w: 9, h: 1.2,
      fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    s.addShape("rect", {
      x: 0.5, y: 1.3, w: 0.08, h: 1.2,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(
      "A wireless motion detection system built around ESP-32 microcontrollers "
      + "that detect room entry and transmit alerts over a WiFi network to a "
      + "central server.",
      {
        x: 0.8, y: 1.4, w: 8.55, h: 1.0,
        fontSize: 16, fontFace: "Calibri", italic: true, color: C.text,
        valign: "middle", margin: 0,
      }
    );

    // Three supporting blocks
    const items = [
      { icon: FaCrosshairs, title: "Detect", body: "PIR + WiFi-only methods for sensing motion in a room." },
      { icon: FaBroadcastTower, title: "Transmit", body: "Real-time alerts over WiFi (HTTP) and ESP-NOW (peer-to-peer)." },
      { icon: FaServer, title: "Aggregate", body: "Central Flask server logs each event and serves a live dashboard." },
    ];
    for (let i = 0; i < 3; i++) {
      const x = 0.5 + i * 3.05;
      s.addShape("rect", {
        x, y: 2.75, w: 2.9, h: 2.45,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.07 },
      });
      await drawIconBadge(s, items[i].icon, x + 0.25, 2.95, 0.55, C.secondary);
      s.addText(items[i].title, {
        x: x + 0.9, y: 2.95, w: 1.9, h: 0.55,
        fontSize: 18, fontFace: "Calibri", bold: true, color: C.primary,
        margin: 0, valign: "middle",
      });
      s.addText(items[i].body, {
        x: x + 0.25, y: 3.65, w: 2.5, h: 1.4,
        fontSize: 13, fontFace: "Calibri", color: C.text, margin: 0, valign: "top",
      });
    }
  }

  // ===================================================================
  // SLIDE 3, Scope (Must / Should / Nice)
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaCheckCircle, 0.5, 0.35, 0.55, C.success);
    drawTitle(s, "Scope & Goals");

    const cols = [
      {
        title: "MUST HAVE", color: C.primary,
        items: [
          "ESP-32 connects to WiFi, stable link",
          "GPIO input detects motion signal",
          "ESP-32 sends HTTP POST alert",
          "Server logs events with timestamps",
          "Signal transmission documented",
        ],
      },
      {
        title: "SHOULD HAVE", color: C.secondary,
        items: [
          "Multiple sensors → one server",
          "Per-sensor identifiers (sensor_id)",
          "WiFi reliability measurements (RSSI)",
          "Interference testing across placements",
          "Cooldown logic against duplicate alerts",
        ],
      },
      {
        title: "NICE TO HAVE", color: C.accent,
        items: [
          "HC-SR501 PIR sensor integration",
          "Live web dashboard (auto-refresh)",
          "WiFi-only sensing (single node)",
          "Dual-node cross-correlation",
          "ESP-NOW peer-to-peer tripwire",
        ],
      },
    ];

    for (let i = 0; i < 3; i++) {
      const x = 0.5 + i * 3.05;
      // Header bar
      s.addShape("rect", {
        x, y: 1.2, w: 2.9, h: 0.5,
        fill: { color: cols[i].color }, line: { color: cols[i].color, width: 0 },
      });
      s.addText(cols[i].title, {
        x, y: 1.2, w: 2.9, h: 0.5,
        fontSize: 14, fontFace: "Calibri", bold: true, color: "FFFFFF",
        align: "center", valign: "middle", margin: 0, charSpacing: 3,
      });
      // Body card
      s.addShape("rect", {
        x, y: 1.7, w: 2.9, h: 3.5,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
      });
      // Checklist inside the body card, each row: green check + text.
      // An optional "talk" flag adds an amber "!" badge on the right,
      // marking items that are spoken talking points during the demo.
      for (let j = 0; j < cols[i].items.length; j++) {
        const item = cols[i].items[j];
        const itemText = typeof item === "string" ? item : item.text;
        const isTalkingPoint = typeof item === "object" && item.talk;
        const y = 1.9 + j * 0.6;

        // green check circle
        s.addShape("ellipse", {
          x: x + 0.2, y: y + 0.03, w: 0.25, h: 0.25,
          fill: { color: C.success }, line: { color: C.success, width: 0 },
        });
        s.addText("\u2713", {
          x: x + 0.2, y: y + 0.02, w: 0.25, h: 0.25,
          fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
          align: "center", valign: "middle", margin: 0,
        });

        // item text (a little narrower when a talking-point badge is present)
        s.addText(itemText, {
          x: x + 0.55, y,
          w: isTalkingPoint ? 1.95 : 2.25,
          h: 0.55,
          fontSize: 11, fontFace: "Calibri", color: C.text, margin: 0, valign: "middle",
          bold: isTalkingPoint,
        });

        // "!" talking-point badge
        if (isTalkingPoint) {
          s.addShape("ellipse", {
            x: x + 2.55, y: y + 0.04, w: 0.24, h: 0.24,
            fill: { color: C.warn }, line: { color: "FFFFFF", width: 1.5 },
          });
          s.addText("!", {
            x: x + 2.55, y: y + 0.04, w: 0.24, h: 0.24,
            fontSize: 13, fontFace: "Calibri", bold: true, color: "FFFFFF",
            align: "center", valign: "middle", margin: 0,
          });
        }
      }
    }
  }

  // ===================================================================
  // SLIDE 4, Hardware
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaMicrochip, 0.5, 0.35, 0.55);
    drawTitle(s, "Hardware");

    // Left: big-stat callout
    s.addShape("rect", {
      x: 0.5, y: 1.25, w: 4.2, h: 3.9,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText("Under budget", {
      x: 0.7, y: 1.5, w: 3.8, h: 0.4,
      fontSize: 14, fontFace: "Calibri", color: "CBD5E1", margin: 0, valign: "top",
      charSpacing: 3,
    });
    s.addText("$44.01", {
      x: 0.7, y: 2.0, w: 3.8, h: 1.3,
      fontSize: 72, fontFace: "Calibri", bold: true, color: "FFFFFF",
      margin: 0, valign: "middle",
    });
    s.addText("total parts cost", {
      x: 0.7, y: 3.35, w: 3.8, h: 0.4,
      fontSize: 14, fontFace: "Calibri", color: "CBD5E1", margin: 0, valign: "top",
    });
    s.addText("Target: $100.  Remaining: ~$56 buffer for extras.", {
      x: 0.7, y: 4.4, w: 3.8, h: 0.6,
      fontSize: 11, fontFace: "Calibri", italic: true, color: "CBD5E1",
      margin: 0, valign: "top",
    });

    // Right: components table
    const parts = [
      ["Qty", "Component", "Notes"],
      ["3",   "ESP-WROOM-32 dev boards",  "2.4 GHz WiFi + BT"],
      ["3",   "HC-SR501 PIR sensors",     "VCC / OUT / GND"],
      ["3",   "Solderless breadboards",   "400 / 830-point"],
      ["126", "Jumper wires (M-M)",       "+ M-F added later"],
      ["2",   "USB micro data cables",    "programming / power"],
    ];
    s.addTable(parts, {
      x: 5.0, y: 1.25, w: 4.5, h: 3.9,
      colW: [0.7, 2.3, 1.5],
      fontSize: 12, fontFace: "Calibri", color: C.text,
      border: { pt: 0.5, color: C.soft },
      rowH: [0.45, 0.65, 0.65, 0.65, 0.65, 0.65],
      fill: { color: "FFFFFF" },
    });
    // (We style the header row visually by overlaying on top of the first row.)
    s.addShape("rect", {
      x: 5.0, y: 1.25, w: 4.5, h: 0.45,
      fill: { color: C.secondary }, line: { color: C.secondary, width: 0 },
    });
    s.addText([
      { text: "QTY", options: { bold: true, color: "FFFFFF" } },
    ], { x: 5.0, y: 1.25, w: 0.7, h: 0.45, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle", margin: 0, charSpacing: 2 });
    s.addText([
      { text: "COMPONENT", options: { bold: true, color: "FFFFFF" } },
    ], { x: 5.7, y: 1.25, w: 2.3, h: 0.45, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", margin: 0, charSpacing: 2 });
    s.addText([
      { text: "NOTES", options: { bold: true, color: "FFFFFF" } },
    ], { x: 8.0, y: 1.25, w: 1.5, h: 0.45, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", margin: 0, charSpacing: 2 });

    // "!" talking-point badge on the "Solderless breadboards" row.
    // Table row 3 starts at y = 1.25 + 0.45 + 0.65 + 0.65 = 3.0 (height 0.65).
    s.addShape("ellipse", {
      x: 9.55, y: 3.20, w: 0.26, h: 0.26,
      fill: { color: C.warn }, line: { color: "FFFFFF", width: 1.5 },
    });
    s.addText("!", {
      x: 9.55, y: 3.20, w: 0.26, h: 0.26,
      fontSize: 13, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ===================================================================
  // SLIDE 5, Series of Tests (bring-up and verification)
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaCogs, 0.5, 0.35, 0.55, C.secondary);
    drawTitle(s, "Series of Tests");

    // Brief subtitle under the title
    s.addText(
      "Each test built on the previous one. Green check means it passed.",
      {
        x: 0.5, y: 0.95, w: 9, h: 0.3,
        fontSize: 12, fontFace: "Calibri", italic: true, color: C.muted,
        margin: 0,
      }
    );

    // Six cards in a 3x2 grid — numbered steps in the bring-up process.
    const steps = [
      { num: "1", title: "Arduino IDE + driver",   body: "Install IDE, add ESP-32 board package, install CP210x USB driver, detect board on COM3." },
      { num: "2", title: "Hello World",            body: "Upload a Serial.println sketch. Confirm the upload toolchain works and Serial Monitor reads at 115200 baud." },
      { num: "3", title: "WiFi connection",        body: "Join the home WiFi. Verify DHCP-assigned IP and check RSSI over time." },
      { num: "4", title: "GPIO input",             body: "Read a digital pin. Start with the BOOT button as a stand-in for the PIR, then swap in the real sensor." },
      { num: "5", title: "HTTP POST to server",    body: "Stand up a Flask server. Fire a JSON POST on each motion event and confirm HTTP 200 with a low-latency round trip." },
      { num: "6", title: "Stretch tests",          body: "Multi-sensor dashboard, WiFi-only RSSI sensing, dual-node correlator, ESP-NOW peer-to-peer tripwire." },
    ];

    const cols = 3, rows = 2;
    const gx = 0.5, gy = 1.4;
    const cw = 3.0, ch = 1.85;
    const pad = 0.05;

    for (let i = 0; i < steps.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = gx + col * (cw + pad * 2 + 0.02);
      const y = gy + row * (ch + 0.18);

      s.addShape("rect", {
        x, y, w: cw, h: ch,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.07 },
      });

      // Numbered circle on the left
      s.addShape("ellipse", {
        x: x + 0.2, y: y + 0.22, w: 0.5, h: 0.5,
        fill: { color: C.primary }, line: { color: C.primary, width: 0 },
      });
      s.addText(steps[i].num, {
        x: x + 0.2, y: y + 0.22, w: 0.5, h: 0.5,
        fontSize: 18, fontFace: "Calibri", bold: true, color: "FFFFFF",
        align: "center", valign: "middle", margin: 0,
      });

      // Green check in the top-right of the card
      s.addShape("ellipse", {
        x: x + cw - 0.38, y: y + 0.1, w: 0.22, h: 0.22,
        fill: { color: C.success }, line: { color: C.success, width: 0 },
      });
      s.addText("\u2713", {
        x: x + cw - 0.38, y: y + 0.1, w: 0.22, h: 0.22,
        fontSize: 10, fontFace: "Calibri", bold: true, color: "FFFFFF",
        align: "center", valign: "middle", margin: 0,
      });

      // Title + body
      s.addText(steps[i].title, {
        x: x + 0.8, y: y + 0.2, w: cw - 1.1, h: 0.4,
        fontSize: 13, fontFace: "Calibri", bold: true, color: C.primary,
        margin: 0, valign: "middle",
      });
      s.addText(steps[i].body, {
        x: x + 0.2, y: y + 0.8, w: cw - 0.35, h: ch - 0.9,
        fontSize: 10, fontFace: "Calibri", color: C.text, margin: 0, valign: "top",
      });
    }
  }

  // ===================================================================
  // SLIDE 6, Architecture diagram
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaProjectDiagram, 0.5, 0.35, 0.55);
    drawTitle(s, "System Architecture");

    // Horizontal pipeline: PIR -> ESP-32 -> Router -> Server -> Dashboard
    const nodes = [
      { icon: FaCrosshairs,     label: "PIR Sensor",   sub: "motion -> GPIO" },
      { icon: FaMicrochip,      label: "ESP-32",       sub: "reads pin, JSON" },
      { icon: FaWifi,           label: "WiFi Router",  sub: "DHCP + LAN" },
      { icon: FaServer,         label: "Flask Server", sub: "logs + API" },
      { icon: FaChartLine,      label: "Dashboard",    sub: "live table" },
    ];

    const startX = 0.4;
    const boxW = 1.55;
    const boxH = 1.7;
    const gap = 0.3;
    const y = 2.0;

    for (let i = 0; i < nodes.length; i++) {
      const x = startX + i * (boxW + gap);

      s.addShape("rect", {
        x, y, w: boxW, h: boxH,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.08 },
      });
      // Colored top strip
      s.addShape("rect", {
        x, y, w: boxW, h: 0.08,
        fill: { color: C.primary }, line: { color: C.primary, width: 0 },
      });

      await drawIconBadge(s, nodes[i].icon, x + (boxW - 0.55) / 2, y + 0.25, 0.55, C.secondary);
      s.addText(nodes[i].label, {
        x, y: y + 0.9, w: boxW, h: 0.4,
        fontSize: 13, fontFace: "Calibri", bold: true, color: C.primary,
        align: "center", margin: 0,
      });
      s.addText(nodes[i].sub, {
        x, y: y + 1.25, w: boxW, h: 0.35,
        fontSize: 10, fontFace: "Calibri", italic: true, color: C.muted,
        align: "center", margin: 0,
      });

      // Arrow between boxes
      if (i < nodes.length - 1) {
        const ax = x + boxW + 0.02;
        const ay = y + boxH / 2;
        s.addShape("rect", {
          x: ax, y: ay - 0.03, w: gap - 0.08, h: 0.06,
          fill: { color: C.secondary }, line: { color: C.secondary, width: 0 },
        });
        s.addShape("right_triangle", {
          x: ax + gap - 0.12, y: ay - 0.13, w: 0.18, h: 0.26,
          fill: { color: C.secondary }, line: { color: C.secondary, width: 0 },
          rotate: 90,
        });
      }
    }

    // Configuration annotations, "?" on PIR (optional) and "x2 / x3"
    // on ESP-32 (multiple nodes / modes).
    const pirX = startX + 0 * (boxW + gap);
    s.addShape("ellipse", {
      x: pirX + boxW - 0.28, y: y - 0.18, w: 0.38, h: 0.38,
      fill: { color: C.warn }, line: { color: "FFFFFF", width: 2 },
    });
    s.addText("?", {
      x: pirX + boxW - 0.28, y: y - 0.18, w: 0.38, h: 0.38,
      fontSize: 18, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });

    const espX = startX + 1 * (boxW + gap);
    s.addShape("roundRect", {
      x: espX + boxW - 0.65, y: y - 0.2, w: 0.9, h: 0.38,
      fill: { color: C.accent }, line: { color: "FFFFFF", width: 2 },
      rectRadius: 0.12,
    });
    s.addText("x2 / x3", {
      x: espX + boxW - 0.65, y: y - 0.2, w: 0.9, h: 0.38,
      fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });

    // Bottom caption
    s.addText(
      "Each ESP-32 is an IoT edge device: a dumb sensor up front, a networked microcontroller in the middle, "
      + "and a central aggregator at the back. The '?' on the PIR and the 'x2 / x3' on the ESP-32 are a "
      + "reminder that this system supports multiple configurations, PIR, WiFi-only, or ESP-NOW tripwire.",
      {
        x: 0.5, y: 4.3, w: 9, h: 0.85,
        fontSize: 11, fontFace: "Calibri", italic: true, color: C.muted,
        align: "center", valign: "middle", margin: 0,
      }
    );
  }

  // ===================================================================
  // SLIDE 6, Networking concepts
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaNetworkWired, 0.5, 0.35, 0.55);
    drawTitle(s, "Networking Concepts Demonstrated");

    const concepts = [
      { icon: FaWifi,           title: "IEEE 802.11 WiFi",     body: "2.4 GHz link between ESP-32 and router." },
      { icon: FaLink,           title: "DHCP",                 body: "Router auto-assigned 10.0.0.148 / 10.0.0.24." },
      { icon: FaCodeBranch,     title: "TCP / HTTP",           body: "JSON POST /motion, response HTTP 200 at 81 ms." },
      { icon: FaServer,         title: "Client-Server",        body: "Many sensors, one Flask aggregator." },
      { icon: FaBroadcastTower, title: "ESP-NOW (peer-to-peer)", body: "Direct ESP-32 <-> ESP-32, no router." },
      { icon: FaDatabase,       title: "Event correlation",    body: "Time-windowed fusion across two nodes." },
    ];

    const cols = 3, rows = 2;
    const gx = 0.5, gy = 1.3;
    const cw = 3.0, ch = 1.9;
    const pad = 0.08;

    for (let i = 0; i < concepts.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = gx + col * (cw + pad * 2 + 0.02);
      const y = gy + row * (ch + 0.2);

      s.addShape("rect", {
        x, y, w: cw, h: ch,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.07 },
      });
      await drawIconBadge(s, concepts[i].icon, x + 0.2, y + 0.25, 0.5, C.primary);
      s.addText(concepts[i].title, {
        x: x + 0.8, y: y + 0.2, w: cw - 0.9, h: 0.45,
        fontSize: 14, fontFace: "Calibri", bold: true, color: C.primary,
        margin: 0, valign: "middle",
      });
      s.addText(concepts[i].body, {
        x: x + 0.25, y: y + 0.85, w: cw - 0.4, h: ch - 0.95,
        fontSize: 11, fontFace: "Calibri", color: C.text, margin: 0, valign: "top",
      });
    }
  }

  // ===================================================================
  // SLIDE 7, Must-have results (big stats)
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaBolt, 0.5, 0.35, 0.55, C.success);
    drawTitle(s, "Must-Have Results");

    const stats = [
      { big: "200 OK",    small: "HTTP response",  sub: "end-to-end delivery confirmed" },
      { big: "81 ms",     small: "round-trip",     sub: "ESP-32 -> WiFi -> router -> server" },
      { big: "-58 dBm",   small: "RSSI (stable)",  sub: "good-signal zone; sustained over 10s+" },
      { big: "10.0.0.148", small: "IP via DHCP",    sub: "auto-assigned from router pool" },
    ];

    for (let i = 0; i < 4; i++) {
      const x = 0.5 + i * 2.37;
      s.addShape("rect", {
        x, y: 1.15, w: 2.2, h: 1.95,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.07 },
      });
      s.addShape("rect", {
        x, y: 1.15, w: 2.2, h: 0.08,
        fill: { color: C.success }, line: { color: C.success, width: 0 },
      });
      s.addText(stats[i].big, {
        x: x + 0.1, y: 1.4, w: 2.0, h: 0.75,
        fontSize: 26, fontFace: "Calibri", bold: true, color: C.primary,
        align: "center", valign: "middle", margin: 0,
      });
      s.addText(stats[i].small, {
        x: x + 0.1, y: 2.2, w: 2.0, h: 0.35,
        fontSize: 13, fontFace: "Calibri", bold: true, color: C.secondary,
        align: "center", margin: 0,
      });
      s.addText(stats[i].sub, {
        x: x + 0.15, y: 2.6, w: 1.9, h: 0.5,
        fontSize: 10, fontFace: "Calibri", italic: true, color: C.muted,
        align: "center", valign: "top", margin: 0,
      });
    }

    // Bottom: Serial Monitor screenshot (left) + takeaway (right)
    // serial_monitor.png is 591 x 327 (aspect ~1.807).
    // With w = 3.35, h = 3.35 / 1.807 = 1.85.
    s.addImage({
      path: "images/serial_monitor.png",
      x: 0.5, y: 3.35, w: 3.35, h: 1.85,
    });
    s.addText("Serial Monitor: HTTP 200  latency=81 ms", {
      x: 0.5, y: 5.2, w: 3.35, h: 0.25,
      fontSize: 9, fontFace: "Calibri", italic: true, color: C.muted,
      align: "center", margin: 0,
    });

    s.addShape("rect", {
      x: 4.1, y: 3.35, w: 5.4, h: 1.85,
      fill: { color: C.dark }, line: { color: C.dark, width: 0 },
    });
    s.addText(
      "Every Must Have is met. The alert pipeline,\nPIR/button -> WiFi -> HTTP -> Flask -> log,\nruns in real time with sub-100 ms latency on a standard home WiFi network.",
      {
        x: 4.3, y: 3.5, w: 5.0, h: 1.6,
        fontSize: 13, fontFace: "Calibri", italic: true, color: "FFFFFF",
        align: "left", valign: "middle", margin: 0,
      }
    );
  }

  // ===================================================================
  // SLIDE 8, Live Dashboard
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaChartLine, 0.5, 0.35, 0.55);
    drawTitle(s, "Live Dashboard (Flask)");

    // Left: features
    const feats = [
      "HTTP POST endpoint /motion accepts JSON alerts from any sensor.",
      "Auto-refreshing table shows the 50 most recent events.",
      "Rows color-coded: green (PIR), blue (WiFi), yellow (high-confidence).",
      "Every alert is also appended to alerts.log for the report.",
      "Reachable at http://10.0.0.113:5000/ from any device on the LAN.",
    ];
    s.addText(
      feats.map((t, i) => ({
        text: t,
        options: { bullet: true, breakLine: i < feats.length - 1, color: C.text },
      })),
      {
        x: 0.5, y: 1.2, w: 4.8, h: 3.9,
        fontSize: 13, fontFace: "Calibri", paraSpaceAfter: 8,
        valign: "top", margin: 0,
      }
    );

    // Right: the REAL dashboard screenshot.
    // motion_detection_server (1).png is 2238 x 1920 (aspect ~1.166).
    // Fit to width 4.1" -> h = 4.1 / 1.166 = 3.52".
    s.addImage({
      path: "images/motion_detection_server (1).png",
      x: 5.4, y: 1.3, w: 4.1, h: 3.52,
    });
    s.addText("Real dashboard capture", {
      x: 5.4, y: 4.85, w: 4.1, h: 0.3,
      fontSize: 10, fontFace: "Calibri", italic: true, color: C.muted,
      align: "center", margin: 0,
    });
  }

  // ===================================================================
  // SLIDE 9, WiFi-only sensing (single node)
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaSatelliteDish, 0.5, 0.35, 0.55);
    drawTitle(s, "WiFi-Only Motion Sensing (no PIR)");

    // Left: explanation
    s.addText(
      [
        { text: "How it works", options: { bold: true, color: C.primary, fontSize: 16, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "Body tissue is mostly water. At 2.4 GHz, water absorbs and reflects "
          + "WiFi signals. When a person moves near the ESP-32, the multipath "
          + "propagation between router and ESP-32 changes, and RSSI wobbles.", options: { fontSize: 12, color: C.text, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "Algorithm", options: { bold: true, color: C.primary, fontSize: 16, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "1. Establish baseline (average RSSI over warmup window)", options: { fontSize: 12, color: C.text, breakLine: true } },
        { text: "2. Poll RSSI at 10 Hz", options: { fontSize: 12, color: C.text, breakLine: true } },
        { text: "3. Fire alert when |RSSI - baseline| ≥ 4 dBm for 2+ samples", options: { fontSize: 12, color: C.text, breakLine: true } },
        { text: "4. Cooldown (5 s) prevents duplicate alerts", options: { fontSize: 12, color: C.text } },
      ],
      { x: 0.5, y: 1.2, w: 4.8, h: 4.0, fontFace: "Calibri", margin: 0, valign: "top" }
    );

    // Right: mini RSSI "chart" drawn with shapes
    s.addShape("rect", {
      x: 5.5, y: 1.2, w: 4.0, h: 3.9,
      fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
    });
    s.addText("RSSI over time (illustrative)", {
      x: 5.6, y: 1.3, w: 3.8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true, color: C.primary,
      margin: 0,
    });
    // Axes
    const axX = 5.75, axY = 4.7, axW = 3.55, axH = 2.85;
    s.addShape("line", { x: axX, y: axY - axH, w: 0, h: axH, line: { color: C.muted, width: 1 } });
    s.addShape("line", { x: axX, y: axY, w: axW, h: 0, line: { color: C.muted, width: 1 } });
    // Baseline line
    const baseY = axY - axH * 0.6;
    s.addShape("line", {
      x: axX, y: baseY, w: axW, h: 0,
      line: { color: C.soft, width: 1, dashType: "dash" },
    });
    s.addText("baseline", {
      x: axX + axW - 1.0, y: baseY - 0.22, w: 1.0, h: 0.22,
      fontSize: 9, fontFace: "Calibri", color: C.muted, align: "right", margin: 0,
    });
    // "RSSI" points  (idle wiggle then a motion dip)
    const seq = [0.05, -0.04, 0.06, -0.03, 0.04, -0.35, -0.55, -0.25, 0.05, -0.02, 0.04];
    let prevX = axX, prevY = baseY;
    for (let i = 0; i < seq.length; i++) {
      const px = axX + (i / (seq.length - 1)) * axW;
      const py = baseY + seq[i] * axH;
      if (i > 0) {
        s.addShape("line", {
          x: prevX, y: prevY, w: px - prevX, h: py - prevY,
          line: { color: C.primary, width: 2 },
        });
      }
      prevX = px; prevY = py;
    }
    // Event marker for the dip
    s.addShape("ellipse", {
      x: axX + (5 / (seq.length - 1)) * axW - 0.12,
      y: baseY + seq[6] * axH - 0.12,
      w: 0.24, h: 0.24,
      fill: { color: C.warn }, line: { color: C.warn, width: 0 },
    });
    s.addText("person\npasses", {
      x: axX + (5 / (seq.length - 1)) * axW - 0.6,
      y: baseY + seq[6] * axH - 0.75,
      w: 1.2, h: 0.5,
      fontSize: 9, fontFace: "Calibri", italic: true, color: C.warn,
      align: "center", margin: 0,
    });
  }

  // ===================================================================
  // SLIDE 10, Dual-node correlation
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaShieldAlt, 0.5, 0.35, 0.55);
    drawTitle(s, "Sensor Fusion: Two Nodes + Correlator");

    // Left: diagram with two nodes + correlator
    s.addShape("rect", {
      x: 0.5, y: 1.25, w: 4.5, h: 3.9,
      fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
    });
    // Node 1
    s.addShape("ellipse", {
      x: 0.9, y: 1.9, w: 0.8, h: 0.8,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText("S1", {
      x: 0.9, y: 1.9, w: 0.8, h: 0.8,
      fontSize: 16, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    // Node 2
    s.addShape("ellipse", {
      x: 0.9, y: 3.5, w: 0.8, h: 0.8,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText("S2", {
      x: 0.9, y: 3.5, w: 0.8, h: 0.8,
      fontSize: 16, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    // Correlator
    s.addShape("rect", {
      x: 3.3, y: 2.5, w: 1.4, h: 1.2,
      fill: { color: C.dark }, line: { color: C.dark, width: 0 },
    });
    s.addText("Correlator\n(3 s window)", {
      x: 3.3, y: 2.5, w: 1.4, h: 1.2,
      fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    // Arrows S1 -> C and S2 -> C
    s.addShape("line", {
      x: 1.75, y: 2.3, w: 1.55, h: 0.9,
      line: { color: C.secondary, width: 2, endArrowType: "triangle" },
    });
    s.addShape("line", {
      x: 1.75, y: 3.9, w: 1.55, h: -0.9,
      line: { color: C.secondary, width: 2, endArrowType: "triangle" },
    });
    // "HIGH-CONF" output
    s.addShape("rect", {
      x: 3.2, y: 4.0, w: 1.6, h: 0.5,
      fill: { color: C.warn }, line: { color: C.warn, width: 0 },
    });
    s.addText("HIGH-CONF", {
      x: 3.2, y: 4.0, w: 1.6, h: 0.5,
      fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    s.addShape("line", {
      x: 4.0, y: 3.7, w: 0, h: 0.3,
      line: { color: C.warn, width: 2, endArrowType: "triangle" },
    });

    // Right: explanation
    s.addText(
      [
        { text: "Why correlate?", options: { bold: true, color: C.primary, fontSize: 16, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "A single noisy RSSI node trips on ambient WiFi jitter. "
          + "Real motion disturbs both paths nearly at once. Requiring both "
          + "nodes to agree within 3 seconds suppresses independent noise "
          + "while preserving true positives.", options: { fontSize: 12, color: C.text, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "Observed result", options: { bold: true, color: C.primary, fontSize: 16, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 6 } },
        { text: "23 alerts captured in a short demo window", options: { fontSize: 12, color: C.text, bullet: true, breakLine: true } },
        { text: "2 flagged as HIGH_CONFIDENCE_MOTION", options: { fontSize: 12, color: C.text, bullet: true, breakLine: true } },
        { text: "Same pattern commercial systems use (Ring, Nest)", options: { fontSize: 12, color: C.text, bullet: true } },
      ],
      { x: 5.3, y: 1.25, w: 4.2, h: 4.0, fontFace: "Calibri", margin: 0, valign: "top" }
    );

    // "!" talking-point badge on the "Why correlate?" section header.
    // Reminder to talk about: why a single node is noisy / why 2 is
    // meaningfully better / the measured improvement.
    s.addShape("ellipse", {
      x: 6.4, y: 1.25, w: 0.28, h: 0.28,
      fill: { color: C.warn }, line: { color: "FFFFFF", width: 1.5 },
    });
    s.addText("!", {
      x: 6.4, y: 1.25, w: 0.28, h: 0.28,
      fontSize: 14, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ===================================================================
  // SLIDE 11, ESP-NOW peer-to-peer tripwire
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaBroadcastTower, 0.5, 0.35, 0.55, C.accent);
    drawTitle(s, "Peer-to-Peer Tripwire (ESP-NOW)");

    // Left: brief explanation (most detail lives in the speaker notes).
    s.addText(
      [
        { text: "From coverage to tripwire", options: { bold: true, color: C.primary, fontSize: 18, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 8 } },
        { text: "Two ESP-32s now talk directly using ESP-NOW, bypassing the router. "
          + "One beacons, one measures.", options: { fontSize: 14, color: C.text, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 8 } },
        { text: "Beacon:", options: { bold: true, color: C.primary, fontSize: 14 } },
        { text: "  broadcasts a tiny packet 10 times per second.", options: { fontSize: 13, color: C.text, breakLine: true } },
        { text: "Receiver:", options: { bold: true, color: C.primary, fontSize: 14 } },
        { text: "  reads each packet's RSSI, watches for deviations, fires an HTTP alert.", options: { fontSize: 13, color: C.text, breakLine: true } },
        { text: "", options: { breakLine: true, fontSize: 8 } },
        { text: "Adaptive baseline (EMA):", options: { bold: true, color: C.primary, fontSize: 14 } },
        { text: "  the \"normal\" RSSI drifts to track the current environment.", options: { fontSize: 13, color: C.text } },
      ],
      { x: 0.5, y: 1.2, w: 4.7, h: 4.0, fontFace: "Calibri", margin: 0, valign: "top" }
    );

    // "!" talking-point badge, parked in the top-right corner of the
    // dark visual card, signals "talk about the close-range saturation
    // problem here."
    s.addShape("ellipse", {
      x: 9.10, y: 1.30, w: 0.32, h: 0.32,
      fill: { color: C.warn }, line: { color: "FFFFFF", width: 1.5 },
    });
    s.addText("!", {
      x: 9.10, y: 1.30, w: 0.32, h: 0.32,
      fontSize: 16, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });

    // Right: tripwire visual (two nodes + direct beam + a figure).
    // Card background
    s.addShape("rect", {
      x: 5.4, y: 1.2, w: 4.1, h: 3.9,
      fill: { color: C.darker }, line: { color: C.darker, width: 0 },
    });

    // Coordinates (kept inside the card: x in [5.4, 9.5], y in [1.2, 5.1])
    const nx = 6.1, ny = 3.1;    // beacon center
    const rx_ = 8.8, ry_ = 3.1;  // receiver center

    // Dashed "beam" between the two nodes (drawn first so nodes overlap it cleanly)
    s.addShape("line", {
      x: nx + 0.22, y: ny, w: rx_ - nx - 0.44, h: 0,
      line: { color: C.accent, width: 2, dashType: "dash" },
    });

    // Beacon node
    s.addShape("ellipse", {
      x: nx - 0.22, y: ny - 0.22, w: 0.44, h: 0.44,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
    s.addText("Beacon", {
      x: nx - 0.8, y: ny + 0.3, w: 1.6, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", margin: 0,
    });
    s.addText("broadcasts", {
      x: nx - 0.8, y: ny + 0.6, w: 1.6, h: 0.3,
      fontSize: 9, fontFace: "Calibri", italic: true, color: "CBD5E1",
      align: "center", margin: 0,
    });

    // Receiver node
    s.addShape("ellipse", {
      x: rx_ - 0.22, y: ry_ - 0.22, w: 0.44, h: 0.44,
      fill: { color: C.success }, line: { color: C.success, width: 0 },
    });
    s.addText("Receiver", {
      x: rx_ - 0.8, y: ry_ + 0.3, w: 1.6, h: 0.3,
      fontSize: 11, fontFace: "Calibri", bold: true, color: "FFFFFF",
      align: "center", margin: 0,
    });
    s.addText("measures RSSI", {
      x: rx_ - 0.8, y: ry_ + 0.6, w: 1.6, h: 0.3,
      fontSize: 9, fontFace: "Calibri", italic: true, color: "CBD5E1",
      align: "center", margin: 0,
    });

    // "Person" silhouette interrupting the beam (halfway between nodes)
    const px = (nx + rx_) / 2;
    s.addShape("ellipse", {
      x: px - 0.16, y: ny - 0.72, w: 0.32, h: 0.32,
      fill: { color: C.warn }, line: { color: C.warn, width: 0 },
    });
    s.addShape("rect", {
      x: px - 0.22, y: ny - 0.38, w: 0.44, h: 0.7,
      fill: { color: C.warn }, line: { color: C.warn, width: 0 },
    });
    s.addText("motion", {
      x: px - 0.5, y: ny + 0.38, w: 1.0, h: 0.28,
      fontSize: 10, fontFace: "Calibri", italic: true, bold: true, color: "FBBF24",
      align: "center", margin: 0,
    });

    // Top header inside the card
    s.addText("Direct ESP-NOW link, no router involved", {
      x: 5.4, y: 1.4, w: 4.1, h: 0.35,
      fontSize: 11, fontFace: "Calibri", bold: true, color: C.accent,
      align: "center", margin: 0,
    });

    // Bottom caption
    s.addText("A person crossing the beam drops RSSI, tripwire fires.", {
      x: 5.4, y: 4.75, w: 4.1, h: 0.3,
      fontSize: 10, fontFace: "Calibri", italic: true, color: "CBD5E1",
      align: "center", margin: 0,
    });
  }

  // ===================================================================
  // SLIDE 13, Future work
  // ===================================================================
  {
    const s = newContentSlide(pres);
    await drawIconBadge(s, FaRocket, 0.5, 0.35, 0.55, C.accent);
    drawTitle(s, "Future Work");

    const futures = [
      { icon: FaSatelliteDish, title: "CSI-based sensing", body: "Channel State Information gives amplitude + phase across many subcarriers. Enables gesture recognition, respiration detection, even rough room mapping." },
      { icon: FaNetworkWired,  title: "IEEE 802.11bf (WLAN Sensing)", body: "Emerging standard that formalizes WiFi for sensing. Our RSSI demo is the foundational idea; 802.11bf is the industrial version." },
      { icon: FaMobileAlt,     title: "Battery-powered nodes", body: "ESP-32 deep sleep with PIR wake-up pushes typical draw to microamps. A small LiPo could run a node for weeks." },
      { icon: FaRegLightbulb,  title: "Multi-node localization", body: "Three or more nodes + signal strength fingerprinting can estimate where motion happened, not just that motion occurred." },
    ];

    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.5 + col * 4.55, y = 1.3 + row * 1.95;
      s.addShape("rect", {
        x, y, w: 4.45, h: 1.75,
        fill: { color: "FFFFFF" }, line: { color: C.soft, width: 1 },
        shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.07 },
      });
      await drawIconBadge(s, futures[i].icon, x + 0.2, y + 0.25, 0.55, C.primary);
      s.addText(futures[i].title, {
        x: x + 0.9, y: y + 0.2, w: 3.45, h: 0.45,
        fontSize: 14, fontFace: "Calibri", bold: true, color: C.primary, margin: 0, valign: "middle",
      });
      s.addText(futures[i].body, {
        x: x + 0.25, y: y + 0.75, w: 4.1, h: 0.95,
        fontSize: 11, fontFace: "Calibri", color: C.text, margin: 0, valign: "top",
      });
    }
  }

  // ===================================================================
  // SLIDE 14, Closing
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.darker };

    // Accent bar
    s.addShape("rect", {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });

    s.addText("Thank you.", {
      x: 0.7, y: 0.5, w: 5.3, h: 1.0,
      fontSize: 42, fontFace: "Calibri", bold: true, color: "FFFFFF",
      margin: 0,
    });
    s.addText("Questions & live demo.", {
      x: 0.7, y: 1.5, w: 5.3, h: 0.5,
      fontSize: 18, fontFace: "Calibri", italic: true, color: "CBD5E1",
      margin: 0,
    });

    // Stats 2x2 grid on the left.
    const stats = [
      { big: "5 / 5",  small: "Must Haves" },
      { big: "5 / 5",  small: "Should Haves" },
      { big: "5 / 5",  small: "Nice Haves" },
      { big: "81 ms",  small: "round-trip" },
    ];
    const statW = 2.45, statH = 1.2;
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.7 + col * (statW + 0.1);
      const y = 2.4 + row * (statH + 0.1);
      s.addShape("rect", {
        x, y, w: statW, h: statH,
        fill: { color: "10162E" }, line: { color: C.secondary, width: 1 },
      });
      s.addText(stats[i].big, {
        x, y: y + 0.05, w: statW, h: 0.7,
        fontSize: 26, fontFace: "Calibri", bold: true, color: C.accent,
        align: "center", valign: "middle", margin: 0,
      });
      s.addText(stats[i].small, {
        x, y: y + 0.75, w: statW, h: 0.4,
        fontSize: 11, fontFace: "Calibri", color: "CBD5E1",
        align: "center", valign: "middle", margin: 0, charSpacing: 2,
      });
    }

    // Project hierarchy image on the right side.
    // Native size 240 x 352 (portrait, aspect ~0.682).
    // With w = 3.0, h = 3.0 / 0.682 = 4.4.
    s.addImage({
      path: "images/project_hierarchy.png",
      x: 6.3, y: 0.5, w: 3.0, h: 4.4,
    });
    s.addText("Project hierarchy", {
      x: 6.3, y: 4.95, w: 3.0, h: 0.3,
      fontSize: 11, fontFace: "Calibri", italic: true, color: "CBD5E1",
      align: "center", margin: 0,
    });
  }

  // ===================================================================
  // SPEAKER NOTES, one block per slide (by zero-indexed position).
  // These are meant to be glanced at, not read word-for-word.
  // ===================================================================
  const notes = [
    // Slide 1, Title
    `This project is a distributed motion detection system built with ESP-32 microcontrollers for CNT 1510 Wireless Networking.

The presentation walks through the goals, the architecture, measured results, and a couple of real problems that came up during the build.

The system is organized around the core theme of this class, wireless communication. There's WiFi between each ESP-32 and the router, HTTP between the ESP-32 and a central server, and a direct peer-to-peer ESP-32 link for one of the stretch goals.`,

    // Slide 2, The Project
    `The one-sentence summary is at the top.

The project breaks into three pieces:
- Detect: a sensor notices motion in a room.
- Transmit: the event is packaged as an HTTP message and sent over WiFi.
- Aggregate: a central server collects events from every sensor, logs them with timestamps, and serves a live dashboard.

Important design choice, the sensor and the networking are kept independent. That decoupling turned out to matter when the PIR hardware had a connector problem; work on the network side never had to stop.`,

    // Slide 3, Scope & Goals
    `The assignment spec had three tiers, must-have, should-have, and nice-to-have.

The left column is the required functionality: WiFi, a GPIO motion signal, HTTP alerts, a server that logs with timestamps, and documentation. Worth noting: the must-have talks about "a GPIO motion signal," not specifically a PIR sensor. That was deliberate. The project is a motion detection system built around the ESP-32, not around a specific sensor model. Any digital input that goes high on motion works.

The middle column is the enhancements, multiple sensors, per-sensor IDs, reliability measurements, cooldown logic.

The right column is the stretch goals. HC-SR501 PIR integration is listed here so the project stands on its own if the PIR's swapped in later: the live dashboard, WiFi-only sensing, cross-correlation, and the ESP-NOW peer-to-peer tripwire are what turn this from a basic wireless alert into a real distributed sensor network. Every item has a green check because each one is actually working.`,

    // Slide 4, Hardware
    `Total build cost was forty-four dollars, well under the hundred-dollar budget.

The "!" on the breadboard row is a reminder to talk about this: honestly, the breadboard was never really needed. It came in the starter kit, but the final wiring ended up being straight jumper connections between the ESP-32 pins and the PIR. The cost could easily have been halved by skipping the breadboard and backup parts. The backups were bought just in case something got broken, since this was the first hardware project, but last week's lab made it pretty clear that ESP-32s are actually hard to break, so they ended up being unnecessary.

Also worth mentioning here: the PIR sensor that arrived had its header pins pointing up, and the included kit only had male-to-male jumper wires, which can't connect two male pins. The fix was to order male-to-female wires (Amazon Same-Day) and, while waiting for them, use the ESP-32's on-board BOOT button as a digital stand-in so the rest of the pipeline could be built and tested. That's a good example of why the sensor and the network code were kept independent.

The key component is the ESP-WROOM-32, an ESP-32 dev board with built-in 2.4 GHz WiFi and Bluetooth. That's why it's ideal for a networking class project: the wireless stack is already baked into the chip.

The HC-SR501 is a passive infrared motion sensor. It's a dumb sensor, it just outputs a voltage when it detects body heat. The ESP-32 does all the thinking.`,

    // Slide 5, Series of Tests
    `This is the bring-up sequence, in the order it actually happened. Each step had to work before moving to the next.

Step 1, Arduino IDE and driver. The first real problem: Windows didn't recognize the ESP-32 because the CP210x USB-to-UART driver wasn't installed. Installing it from Silicon Labs made the board appear as COM3 and let the IDE talk to it.

Step 2, Hello World. A tiny sketch that just prints over serial. Had to remember to set the Serial Monitor to 115200 baud or the output comes out as garbage characters.

Step 3, WiFi connection. Use the WiFi library to join the home network. The board gets an IP from DHCP (10.0.0.148) and reports RSSI to the Serial Monitor, which becomes the foundation for every later test.

Step 4, GPIO input. Read a digital pin and react to it. The BOOT button on the ESP-32 was used as a digital stand-in for the PIR sensor while hardware was still incoming, but the firmware read the pin state exactly the same way either source.

Step 5, HTTP POST to server. A small Flask server on the PC listening on port 5000. The ESP-32 posts a JSON payload on each motion event; server responds 200 OK and logs the event with a timestamp. First end-to-end "it works" moment, with a round-trip of 81 milliseconds.

Step 6, Stretch tests. Once the core pipeline was solid, added: a second ESP-32 reporting to the same server, the WiFi-only sensing demo (no PIR at all), the dual-node correlator that looks for agreement between two nodes, and the ESP-NOW peer-to-peer tripwire. Each one is a separate test folder in the project with its own sketch and results.`,

    // Slide 6, System Architecture
    `This is the data flow through the system.

Note two things on the diagram: the "?" on the PIR box and the "x2 / x3" on the ESP-32 box. Both are deliberate, this system supports multiple configurations, not just one. The PIR is optional: it can be replaced with a different sensor or skipped entirely for the WiFi-only version. And the ESP-32 count varies: one for basic PIR motion detection, two for dual-node cross-correlation or the ESP-NOW tripwire, and three or more for future multi-node localization. Each configuration has its own networking method.

Walking through the baseline pipeline: the PIR sensor outputs a voltage on a single wire when motion is detected, about as low-tech as sensors get.

The ESP-32 reads that pin on a GPIO, formats a JSON payload, and fires it off over WiFi as an HTTP POST.

The router handles DHCP and routes the packet over 802.11 to the PC.

The Flask server receives the POST, writes a line to a log file with a timestamp, and updates a live dashboard.

Zoom out and this is a textbook IoT architecture, dumb sensors up front, a smart networked edge device in the middle, and a central aggregator in the back. Same pattern used by Ring doorbells, Nest thermostats, industrial sensor networks.`,

    // Slide 7, Networking Concepts
    `This slide maps what was actually built to the networking concepts from class.

IEEE 802.11 WiFi is the physical and MAC layer, every ESP-32 does a standard WiFi handshake with the router.

DHCP is how the ESP-32s got their IP addresses automatically,10.0.0.148 and 10.0.0.24, without any manual configuration.

TCP with HTTP is the transport layer. JSON alerts go out as POST requests; the server replies 200 OK. Round-trip measured at 81 milliseconds.

Client-server architecture: many sensors, one Flask aggregator.

Two things that go beyond the basic requirements: ESP-NOW, Espressif's peer-to-peer wireless protocol that bypasses the router, and server-side event correlation, a simple form of sensor fusion across multiple nodes.`,

    // Slide 8, Must-Have Results
    `These are real numbers from the first successful end-to-end test.

200 OK means the server accepted and logged the alert, no packets dropped on the network.

81 milliseconds is the total round-trip: ESP-32 detects motion, packet goes over WiFi, through the router, to the PC, server responds, and response comes back. Under 100 ms is basically real-time for human perception.

RSSI of negative 58 dBm is the signal strength. Anything between roughly -50 and -70 is the "good" zone, stable and reliable.

And the IP 10.0.0.148 was handed out by the router via DHCP, no hard-coded addresses anywhere.

Bottom line: all five must-haves are met with concrete measurements, not just "it worked."`,

    // Slide 9, Live Dashboard
    `The dashboard is a small Flask web app running on the PC, written in Python.

It exposes one main endpoint, POST /motion, that accepts JSON from any ESP-32 on the LAN. Every alert gets a timestamp, a sensor ID, and the source IP.

The page auto-refreshes every five seconds, so it doubles as a live visualization during a demo.

Rows are color-coded by event type: green for PIR or button motion, blue for WiFi-only motion, yellow for high-confidence cross-correlated events.

Every alert is also appended to alerts.log on disk for the write-up.

The server listens on 0.0.0.0 port 5000, so any device on the network, including the ESP-32s, can reach it at http://10.0.0.113:5000.`,

    // Slide 10, WiFi-Only Sensing
    `This was the first stretch goal. The question: can an ESP-32 detect motion without any sensor hardware, just using WiFi signals?

The physics answer is yes. The human body is mostly water, and water absorbs and reflects 2.4 GHz signals. When a person walks near an ESP-32, the multipath propagation between the ESP-32 and the router changes, and that shows up as fluctuations in RSSI.

The algorithm is simple: collect a baseline by averaging RSSI during a warmup period, then watch for deviations. If the deviation crosses a threshold for enough samples in a row, fire a motion alert.

The mini chart on the right shows a typical trace. On the left it's just idle noise. In the middle, when a person walks through, the RSSI takes a clear dip, that's the trigger.`,

    // Slide 11, Dual-Node Correlator
    `The single-node version has a problem, WiFi signals are noisy, so false triggers are common.

The fix is a classic sensor-fusion trick. Add a second ESP-32, have it run the same detection algorithm independently, and have the server look for alerts from both nodes arriving within a short time window. That's the correlator.

Independent noise rarely lines up in time between two physically separated nodes, but a real person walking through the room disturbs both paths simultaneously. So "both nodes agreed within three seconds" becomes a much higher-confidence signal.

On the server side, this is implemented with a cooldown so one event doesn't produce a flood of alerts. During testing, the dashboard captured two yellow HIGH_CONFIDENCE_MOTION rows in a single session.

This is basically the same sensor-fusion pattern commercial smart-home systems use under the hood.`,

    // Slide 12, ESP-NOW Tripwire
    `Even the dual-node correlator had a subtle limitation: each node was measuring its own link to the router, not the space directly between the two nodes.

The fix was switching to ESP-NOW. It's Espressif's connectionless wireless protocol that lets two ESP-32s talk directly to each other, with no router in the middle.

One board becomes a beacon, broadcasting tiny packets ten times a second. The other board listens and reads the RSSI of each received packet. When a person physically crosses the direct line between the two boards, the RSSI drops sharply, a real tripwire.

The "!" on this slide is a reminder to tell the close-range story. The first time this was set up, the two boards were placed too close together, only a foot or two apart, and the tripwire was firing constantly with nobody near it. The Serial Monitor showed a baseline around negative 27 dBm with random dips down to negative 36. That's extremely strong signal, which sounds like a good thing, but at that level the radio is saturated: tiny environmental events like WiFi interference, multipath reflections, even airflow produce outsized RSSI swings. The fix was just moving the two boards apart, across the room. The baseline dropped into the negative 50 to negative 70 range, which is the sweet spot for motion sensing, and the false triggers stopped. The takeaway: RSSI has a Goldilocks zone. More signal is not always better.

On adaptive baseline: the first version used a fixed baseline set during a 10-second warmup and never changed. That caused two problems. One, moving the boards to a new position broke detection until the sketch was restarted. Two, anyone sitting in the beam created a continuous "broken" state because the baseline never absorbed their presence. The fix was to replace the fixed value with an Exponential Moving Average, where each new sample nudges the baseline about one percent toward the current RSSI. Fast events (a person walking through in one or two seconds) barely move the baseline and still trigger the tripwire. Slow events (moved boards, a person sitting still for thirty seconds) get absorbed as the new normal and the system re-arms on its own. The same EMA algorithm shows up in TCP's round-trip-time estimator and in computer-vision background subtraction.`,

    // Slide 13, Future Work (unchanged position — debugging slide removed)
    `Four directions for future work.

CSI, Channel State Information, is a much richer view of the wireless channel than RSSI. It can support gesture recognition, respiration detection, even rough through-wall imaging. ESP-32 supports it; the limitation is the signal-processing complexity.

IEEE 802.11bf is a new standard in development for formal WiFi-based sensing. The RSSI demo here is the foundational idea; 802.11bf is the industrial version being standardized right now.

Battery power: the ESP-32 has a deep-sleep mode that cuts current to the microamp range. A small lithium battery with PIR wake-up could run a node for weeks instead of needing a USB cable.

And multi-node localization: with three or more nodes, RSSI fingerprints can be triangulated to estimate where motion happened, not just that it did.`,

    // Slide 14, Thank You (unchanged position — debugging slide removed)
    `Recap: a real distributed wireless sensor network. Every must-have, should-have, and nice-to-have is met. End-to-end latency is 81 milliseconds on standard home WiFi.

The image on the right is the actual project file tree. Everything is there: the Arduino sketches for each mode (motion_sensor, wifi_sensing, esp_now_beacon, esp_now_tripwire), the Flask server, the engineering notebook written entry by entry as the project went, and a REFERENCES file with the 802.11, RFC, and Espressif docs that backed the networking claims.

Happy to take questions or run a live demo of any piece: the button-driven motion pipeline, the WiFi-only sensing, or the ESP-NOW tripwire.`,
  ];

  // Attach notes to each slide in order.
  for (let i = 0; i < pres.slides.length && i < notes.length; i++) {
    pres.slides[i].addNotes(notes[i]);
  }

  await pres.writeFile({ fileName: "C:/Users/shawn/OneDrive/Desktop/networking-project/presentation.pptx" });
  console.log("presentation.pptx written with speaker notes.");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
