E.setFlags({ pretokenise: 1 });

Bangle.setUI({
  mode: "custom",
  touch: (btn, e) => onScreenTap(e.x, e.y),
  btn: (btn) => onBTN1Pressed(),
});

const fgravity = 9.81;
const airFriction = 0.05;
const colors = ["#ff0000", "#00ff00", "#00ffff", "#ffff00", "#0000ff"];

let allFireworks = [];
let allParticles = [];
let playing = true;
let interval = 3000;
let score = 0;
let lives = 5;
g.setBgColor(0, 0, 0);
g.setColor(1, 1, 1);

g.clearRect(0, 0, 176, 176);

function onBTN1Pressed() {
  if (playing) {
    detonateFirework();
  } else {
    start();
  }
  // explodeFirework(80, 80, 0, -3, 6);
}

function decreaseLife() {
  lives--;
  if (lives < 0) {
    playing = false;
  }
}

function detonateFirework() {
  if (allFireworks.length == 0) return;
  const nearestFirework = allFireworks.reduce((f, curr) =>
    f.dist < curr.dist ? f : curr
  );

  if (nearestFirework.dist < nearestFirework.target[2] * 2.5) {
    score += Math.max(100 - nearestFirework.dist * 10, 10);
  } else {
    decreaseLife();
  }

  allFireworks = allFireworks.filter((f) => f != nearestFirework);
  explodeFirework(
    nearestFirework.x,
    nearestFirework.y,
    (Math.random() - 0.5) * 10,
    -3,
    2 + ~~(Math.random() * 6),
    nearestFirework.color
  );
}

function spawnFirework() {
  if (!playing) {
    return;
  }
  setTimeout(() => spawnFirework(), interval);
  if (allFireworks.length > 2) {
    return;
  }
  const speed = 1.5 + Math.random() * 2;

  const target = new Uint8Array([
    23 + Math.random() * 130,
    60 + (Math.random() - 0.5) * 30,
    3 + ~~(Math.random() * 8),
  ]);

  // TODO maybe not straight fireworks?
  allFireworks.push({
    x: target[0],
    y: 176,
    vx: 0,
    vy: -speed,
    target,
    trail: new Uint8Array(10),
    dist: 9999,
    color:
      Math.random() > 0.03
        ? colors[~~(Math.random() * colors.length)]
        : undefined,
    age: 0,
  });
  interval *= 0.98;
  interval = Math.max(interval, 500);
}

function explodeFirework(x, y, vx, vy, numParticles, color) {
  for (let i = 0; i < numParticles; i++) {
    allParticles.push({
      x,
      y,
      vx: vx + Math.sin((Math.PI * 2 * i) / numParticles) * 5,
      vy: vy - Math.cos((Math.PI * 2 * i) / numParticles) * 5,
      trail: new Uint8Array(10),
      color: color ? color : colors[~~(Math.random() * colors.length)],
    });
  }
}

function onScreenTap(x, y) {
  console.log("tap");
}

function tickParticle(tDeltaMs, p) {
  const newTrail = new Uint8Array(10);
  newTrail.set(p.trail, 2, 8);
  newTrail.set([p.x, p.y], 0, 2);
  p.trail = newTrail;
  p.vy += fgravity * (tDeltaMs / 1000);
  p.vy *= 1 - airFriction;
  p.vx *= 1 - airFriction;
  p.y += p.vy;
  p.x += p.vx;
}

function tickFirework(tDeltaMs, p) {
  const newTrail = new Uint8Array(10);
  newTrail.set(p.trail, 2, 8);
  newTrail.set([p.x, p.y], 0, 2);
  p.trail = newTrail;
  p.y += p.vy;
  p.x += p.vx;
  let dx = p.x - p.target[0];
  let dy = p.y - p.target[1];
  p.dist = Math.sqrt(dx * dx + dy * dy);
  p.age++;
}

function drawParticle(p) {
  g.setColor(p.color);
  g.drawCircle(p.x, p.y, 2);
  for (let i = 0; i < 10; i += 2) {
    g.setPixel(p.trail[i], p.trail[i + 1]);
  }
}

function drawFirework(f) {
  if (f.color) {
    g.setColor(f.color);
  } else {
    g.setColor(colors[~~(f.age / 6) % colors.length]);
  }
  g.drawCircle(f.x, f.y, 1);
  g.drawRect(
    f.target[0] - f.target[2],
    f.target[1] - f.target[2],
    f.target[0] + f.target[2],
    f.target[1] + f.target[2]
  );
  for (let i = 0; i < 10; i += 2) {
    g.setPixel(f.trail[i], f.trail[i + 1]);
  }
}

function removeOOBParticles() {
  allParticles = allParticles.filter(
    (p) => !(p.y > 200 || p.x < -20 || p.x > 200)
  );
}

function removeOOBFireworks() {
  allFireworks = allFireworks.filter(
    (p) => !(p.y < 0 || p.x < -20 || p.x > 200)
  );
}

let lastDraw = new Date();

function draw() {
  const now = new Date();
  let msSinceLastDraw = now - lastDraw;
  allParticles.forEach((p) => tickParticle(msSinceLastDraw, p));
  allFireworks.forEach((f) => tickFirework(msSinceLastDraw, f));
  removeOOBParticles();
  removeOOBFireworks();
  // draw stuff
  g.clearRect(0, 0, 176, 176);
  allParticles.forEach((p) => drawParticle(p));
  allFireworks.forEach((f) => drawFirework(f));

  g.setColor(1, 1, 1);
  if (playing) {
    g.setFont("4x6");
    g.setFontAlign(-1, -1, 0);
    g.drawString(`SCORE: ${Math.floor(score)}`, 0, 0, true);
    g.setFontAlign(1, 1, 0);
    g.drawString(`LIVES: ${lives}`, 176, 176, true);
  } else {
    g.setFont("Vector:14");
    g.setFontAlign(0, 0, 0);
    g.drawString(`GAME OVER!`, 176 / 2, 80, true);
    g.drawString(`Score: ${Math.floor(score)}`, 176 / 2, 110, true);
  }

  lastDraw = now;
  setTimeout(() => draw(), 1000 / 15);
}

setTimeout(() => draw(), 1000 / 15);

function start() {
  allFireworks = [];
  allParticles = [];
  score = 0;
  playing = true;
  interval = 3000;
  lives = 3;
  spawnFirework();
}
start();
