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

  if (nearestFirework.dist < nearestFirework.target.size * 2.5) {
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
  const speed = 1.5 + Math.random() * 2;

  const target = {
    x: 23 + Math.random() * 130,
    y: 60 + (Math.random() - 0.5) * 30,
    size: 3 + ~~(Math.random() * 8),
  };

  // TODO maybe not straight fireworks?
  allFireworks.push({
    x: target.x,
    y: 176,
    vx: 0,
    vy: -speed,
    target,
    trail: [],
    dist: 9999,
    color:
      Math.random() > 0.03
        ? colors[~~(Math.random() * colors.length)]
        : undefined,
    age: 0,
  });
  interval *= 0.98;
  interval = Math.max(interval, 500);
  setTimeout(() => spawnFirework(), interval);
}

function explodeFirework(x, y, vx, vy, numParticles, color) {
  for (let i = 0; i < numParticles; i++) {
    allParticles.push({
      x,
      y,
      vx: vx + Math.sin((Math.PI * 2 * i) / numParticles) * 5,
      vy: vy - Math.cos((Math.PI * 2 * i) / numParticles) * 5,
      trail: [],
      color: color ? color : colors[~~(Math.random() * colors.length)],
    });
  }
}

function onScreenTap(x, y) {
  console.log("tap");
}

function tickParticle(tDeltaMs, p) {
  p.trail.unshift({
    x: p.x,
    y: p.y,
  });
  p.trail = p.trail.slice(0, 5);
  p.vy += fgravity * (tDeltaMs / 1000);
  p.vy *= 1 - airFriction;
  p.vx *= 1 - airFriction;
  p.y += p.vy;
  p.x += p.vx;
}

function tickFirework(tDeltaMs, p) {
  p.trail.unshift({
    x: p.x,
    y: p.y,
  });
  p.trail = p.trail.slice(0, 5);
  p.y += p.vy;
  p.x += p.vx;
  let dx = p.x - p.target.x;
  let dy = p.y - p.target.y;
  p.dist = Math.sqrt(dx * dx + dy * dy);
  p.age++;
}

function drawParticle(p) {
  g.setColor(p.color);
  g.drawCircle(p.x, p.y, 2);
  p.trail.forEach((pos) => g.setPixel(pos.x, pos.y));
}

function drawFirework(f) {
  if (f.color) {
    g.setColor(f.color);
  } else {
    g.setColor(colors[~~(f.age / 6) % colors.length]);
  }
  g.drawCircle(f.x, f.y, 1);
  g.drawRect(
    f.target.x - f.target.size,
    f.target.y - f.target.size,
    f.target.x + f.target.size,
    f.target.y + f.target.size
  );
  f.trail.forEach((pos) => g.setPixel(pos.x, pos.y));
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
}

setInterval(() => draw(), 1000 / 15);

function start() {
  score = 0;
  playing = true;
  interval = 3000;
  lives = 3;
  spawnFirework();
}
start();
