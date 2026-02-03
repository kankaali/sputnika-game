const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

let engine, render, runner;
let currentPlanet = null;
let canDrop = true;
let isAiming = false;
let aimCurrent = { x: 0, y: 0 };

let WIDTH, HEIGHT;
let SPAWN;

/************ CONSTANTS ************/
const MAX_STRETCH = 160;
const MAX_SPEED = 10;

/************ PLANETS ************/
const PLANETS = [
  { radius: 14, color: '#94a3b8' },
  { radius: 18, color: '#38bdf8' }
];

/************ INIT ************/
function init() {
  const container = document.getElementById('game');

  WIDTH = container.clientWidth;
  HEIGHT = container.clientHeight;

  SPAWN = { x: WIDTH / 2, y: Math.max(70, HEIGHT * 0.12) };

  engine = Engine.create();
  engine.world.gravity.y = 1;

  render = Render.create({
    element: container,
    engine,
    options: {
      width: WIDTH,
      height: HEIGHT,
      wireframes: false,
      background: '#0b1026',
      pixelRatio: window.devicePixelRatio
    }
  });

  runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  createWalls();
  bindEvents();
  spawnPlanet();
}

/************ WALLS ************/
function createWalls() {
  const t = 60;
  World.add(engine.world, [
    Bodies.rectangle(WIDTH / 2, HEIGHT + t / 2, WIDTH, t, { isStatic: true }),
    Bodies.rectangle(-t / 2, HEIGHT / 2, t, HEIGHT, { isStatic: true }),
    Bodies.rectangle(WIDTH + t / 2, HEIGHT / 2, t, HEIGHT, { isStatic: true })
  ]);
}

/************ PLANET ************/
function spawnPlanet() {
  if (!canDrop) return;

  const p = PLANETS[Math.random() < 0.8 ? 0 : 1];

  currentPlanet = Bodies.circle(SPAWN.x, SPAWN.y, p.radius, {
    isStatic: true,
    inertia: Infinity,
    restitution: 0.35,
    render: { fillStyle: p.color }
  });

  World.add(engine.world, currentPlanet);
}

/************ INPUT ************/
function pointerPos(e) {
  const r = render.canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function bindEvents() {
  render.canvas.addEventListener('pointerdown', e => {
    if (!currentPlanet) return;
    isAiming = true;
    aimCurrent = pointerPos(e);
  });

  render.canvas.addEventListener('pointermove', e => {
    if (isAiming) aimCurrent = pointerPos(e);
  });

  window.addEventListener('pointerup', () => {
    if (!isAiming || !currentPlanet) return;

    let dx = SPAWN.x - aimCurrent.x;
    let dy = SPAWN.y - aimCurrent.y;

    const len = Math.min(Math.hypot(dx, dy), MAX_STRETCH);
    const speed = (len / MAX_STRETCH) * MAX_SPEED;

    Body.setStatic(currentPlanet, false);
    Body.setVelocity(currentPlanet, {
      x: (dx / len) * speed,
      y: (dy / len) * speed
    });

    currentPlanet = null;
    isAiming = false;
    canDrop = false;

    setTimeout(() => {
      canDrop = true;
      spawnPlanet();
    }, 700);
  });

  Events.on(render, 'afterRender', drawTrajectory);
}

/************ TRAJECTORY ************/
function drawTrajectory() {
  if (!isAiming) return;

  const ctx = render.context;
  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.moveTo(SPAWN.x, SPAWN.y);

  let dx = SPAWN.x - aimCurrent.x;
  let dy = SPAWN.y - aimCurrent.y;
  let len = Math.min(Math.hypot(dx, dy), MAX_STRETCH);

  let vx = (dx / len) * ((len / MAX_STRETCH) * MAX_SPEED);
  let vy = (dy / len) * ((len / MAX_STRETCH) * MAX_SPEED);

  let x = SPAWN.x, y = SPAWN.y;

  for (let i = 0; i < 25; i++) {
    x += vx * 3;
    y += vy * 3;
    if (x < 20 || x > WIDTH - 20) vx *= -1;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/************ RESIZE ************/
window.addEventListener('resize', () => {
  Render.stop(render);
  World.clear(engine.world);
  Engine.clear(engine);
  render.canvas.remove();
  init();
});

init();
