Bangle.setBarometerPower(true, "app");

// add modifiied 4x5 numeric font
(function (graphics) {
  graphics.prototype.setFont4x5NumPretty = function () {
    this.setFontCustom(
      atob("IQAQDJgH4/An4QXr0Fa/BwnwdrcH63BCHwfr8Ha/"),
      45,
      atob("AwIEBAQEBAQEBAQEBA=="),
      5
    );
  };
})(Graphics);

// add font for days of the week
(function (graphics) {
  graphics.prototype.setFontDoW = function () {
    this.setFontCustom(
      atob(
        "///////ADgB//////+AHAD//////gAAAH//////4D8B+A///////4AcAOAH//////4AcAOAAAAAB//////wA4AcAP//////wAAAAAAAA//////4AcAP//////wA4Af//////gAAAH//////5z85+c/OfnOAA4AcAOAH//////4AcAOAAAAAB//////wcAOAHB//////wAAAAAAAA///////ODnBzg5wc4AAAAD//////84OcH//8/+fAAAAAAAAAAAAA/z/5/8/OfnPz/5/8/wAAAD//////84OcH//////AAAAAAAAAAAAA/z/5/8/OfnPz/5/8/wAAAD//////gBwA///////AAAAAAAAAAAAA"
      ),
      48,
      24,
      13
    );
  };
})(Graphics);

// timeout used to update every minute
let drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function () {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

// only draw the first time
function drawBg() {
  const bgImg = require("heatshrink").decompress(
    atob(
      "2FFgImjhnACqcTkAVTkEQCv8QK6kIoAVTgmACqcDCKE////FKQVUgIUB//wCqsNFp8B/IVYmFgIKc3CqkPIKAVDj4VV4AVdgfgK6cHaIrbOCv4VK/iSLCrwWMCrMOAQMPCp7cBCojjFCo/xFgIVQgeHCopABCpcH44Vuh/AQQX/wAV7+F/Cq/nCsw/CCqyvRCvgODCqfAgEDCp4QCSIIVQgIOBDQgGDABX/NgIECCp8HCrM/CgP4CqKaCCqSfCCqq1BCqBuB54VqgYVG/gCECp0BwgCDCp8HgYCDCo/wCo0MgHAjACBj7rDABS1Bv4lBv4rPAAsPCo3+gbbPJAIVFiAXMFZ2AUQsAuAQHiOAgJeE"
    )
  );
  g.reset();
  g.drawImage(bgImg, 0, 90);
}

function square(x, y, w, e) {
  g.setColor("#000").fillRect(x, y, x + w, y + w);
  g.setColor("#fff").fillRect(x + e, y + e, x + w - e, y + w - e);
}

let reading;

Bangle.on("pressure", function (newReading) {
  reading = newReading;
});

function drawLabel(text, x, y, size, font) {
  font = font ? font : "4x5NumPretty";
  size = size ? size : 2;
  g.clearRect(x, y, x + 4 * size * 4 + size * 4, y + size * 5);
  g.setFont(font, size);
  g.drawString(text, x, y);
}

function draw() {
  let d = new Date();
  let h = d.getHours(),
    m = d.getMinutes();
  h = ("0" + h).substr(-2);
  m = ("0" + m).substr(-2);

  let day = d.getDate(),
    mon = d.getMonth(),
    dow = d.getDay();
  day = ("0" + day).substr(-2);
  mon = ("0" + (mon + 1)).substr(-2);
  dow = ((dow + 6) % 7).toString();
  date = day + "." + mon;

  g.reset();

  drawLabel(h, 22, 35, 8);
  drawLabel(m, 98, 35, 8);

  g.clearRect(22, 79, 22 + 24, 79 + 13);
  g.setFont("DoW");
  g.drawString(dow, 22, 79);

  drawLabel(date, 22, 95);

  if (reading) {
    drawLabel(reading.altitude.toFixed(1), 120, 79);
  }

  let bpm = Bangle.getHealthStatus().bpm;
  if (bpm) {
    drawLabel(bpm, 126, 91);
  } else {
    drawLabel("88", 126, 91);
  }

  let daySteps = Bangle.getHealthStatus("day").steps;
  if (daySteps) {
    drawLabel(daySteps, 126, 103);
  } else {
    drawLabel("99", 126, 103);
  }

  // queue draw in one minute
  queueDraw();
}

g.clear();
drawBg();
Bangle.setUI("clock"); // Show launcher when middle button pressed
Bangle.loadWidgets();
Bangle.drawWidgets();
draw();
