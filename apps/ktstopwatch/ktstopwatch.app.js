Bangle.setUI({
  mode: "custom",
  touch: (btn, e) => onScreenTap(e.x, e.y),
  btn: (btn) => onBTN1Pressed(),
});

function padLeft(str, numChars, char) {
  return (Array(numChars).fill(char).join("") + str).slice(-1 * numChars);
}

g.clearRect(0, 0, 176, 176);

let running = false;
let millis = 0;
let lastTime = new Date().getTime();
let longpress = 0;
let ignoreNext = false;

function reset() {
  console.log("reset");
  running = false;
  millis = 0;
}

reset();

function onBTN1Pressed() {
  if (ignoreNext) {
    ignoreNext = false;
    return;
  }
  running = !running;
  if (running) {
    lastTime = new Date().getTime();
  }
}

function formatMillis(millis) {
  // HH:MM:SS.mmm
  return {
    minutes: ~~(millis / 1000 / 60),
    seconds: ~~(millis / 1000) % 60,
    millis: millis % 1000,
  };
}

function draw() {
  g.setFont("6x8");
  g.clearRect(0, 0, 176, 6);
  if (running) {
    const newTime = new Date().getTime();
    const diff = newTime - lastTime;
    millis += diff;
    lastTime = newTime;
  }
  const time = formatMillis(millis);
  g.drawString(
    `${padLeft(time.minutes, 4, " ")}:${padLeft(
      time.seconds,
      2,
      "0"
    )}.${padLeft(time.millis, 3, "0")}`,
    0,
    0,
    true
  );

  if (BTN1.read()) {
    longpress++;
  } else {
    longpress = 0;
  }

  if (longpress > 15) {
    reset();
    ignoreNext = true;
  }
}

setInterval(() => draw(), 1000 / 30);
