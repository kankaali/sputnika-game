/***********************
 * MATTER.JS IMPORTS
 ***********************/
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

/***********************
 * GAME STATE
 ***********************/
let engine, render, runner;
let currentPlanet = null;
let canDrop = true;
let isAiming = false;
let aimCurrent = { x: 0, y: 0 };

let WIDTH, HEIGHT;
let SPAWN_POINT;
let walls = {};

/***********************
 * CONSTANTS
 ***********************/
const MAX_STRETCH = 160;
const MAX_SPEED = 10;
const GRAVITY_Y = 1;

/***********************
 * PLANETS
 ***********************/
const PLANETS = [
  { level: 1, radius: 14, color: '#94a3b8' },
  { level: 2, radius: 18, color: '#38bdf8' },
];

/***********************
 * INIT GAME
 ***********************/
function initGame() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  SPAWN_POINT = {
    x: WIDTH / 2,
    y: Math.max(70, HEIGHT * 0.12)
  };

  engine = Engine.create();
  engine.world.gravity.y = GRAVITY_Y;

  render = Render.create({
    element: document.body,
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

  createBounds();
  registerEngineEvents();
  bindInputEvents();
  spawnWaitingPlanet();
}

/***********************
 * WORLD BOUNDS
 ***********************/
function createBounds() {
  const thickness = 50;

  walls.ground = Bodies.rectangle(
    WIDTH / 2,
    HEIGHT + thickness / 2,
    WIDTH,
    thickness,
    { isStatic: true }
  );

  walls.left = Bodies.rectangle(
    -thickness / 2,
    HEIGHT / 2,
    thickness,
    HEIGHT,
    { isStatic: true }
  );

  walls.right = Bodies.rectangle(
    WIDTH + thickness / 2,
    HEIGHT / 2,
    thickness,
    HEIGHT,
    { isStatic: true }
  );

  World.add(engine.world, Object.values(walls));
}

/***********************
 * PLANET SPAWN
 ***********************/
function createPlanet(level) {
  const p = PLANETS[level - 1];

  const body = Bodies.circle(
    SPAWN_POINT.x,
    SPAWN_POINT.y,
    p.radius,
    {
      restitution: 0.35,
      isStatic: true,
      inertia: Infinity,
      render: { fillStyle: p.color }
    }
  );

  body.level = level;
  World.add(engine.world, body);
  return body;
}

function spawnWaitingPlanet() {
  if (!canDrop) return;
  const level = Math.random() < 0.8 ? 1 : 2;
  currentPlanet = createPlanet(level);
}

/***********************
 * ENGINE EVENTS
 ***********************/
function registerEngineEvents() {
  Events.on(engine, 'beforeUpdate', () => {
    if (currentPlanet && isAiming) {
      Body.setVelocity(currentPlanet, { x: 0, y: 0 });
      Body.setPosition(currentPlanet, SPAWN_POINT);
    }
  });

  Events.on(render, 'afterRender', drawTrajectory);
}

/***********************
 * INPUT HELPERS
 ***********************/
function getPointerPos(e) {
  const rect = render.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/***********************
 * INPUT EVENTS
 ***********************/
function bindInputEvents() {
  render.canvas.addEventListener('pointerdown', e => {
    if (!currentPlanet || !canDrop) return;
    isAiming = true;
    aimCurrent = getPointerPos(e);
  });

  render.canvas.addEventListener('pointermove', e => {
    if (!isAiming) return;
    aimCurrent = getPointerPos(e);
  });

  window.addEventListener('pointerup', () => {
    if (!isAiming || !currentPlanet) return;

    let dx = SPAWN_POINT.x - aimCurrent.x;
    let dy = SPAWN_POINT.y - aimCurrent.y;

    const stretch = Math.min(Math.hypot(dx, dy), MAX_STRETCH);
    const nx = dx / (stretch || 1);
    const ny = dy / (stretch || 1);
    const speed = (stretch / MAX_STRETCH) * MAX_SPEED;

    Body.setStatic(currentPlanet, false);
    Body.setVelocity(currentPlanet, {
      x: nx * speed,
      y: ny * speed
    });

    currentPlanet = null;
    isAiming = false;
    canDrop = false;

    setTimeout(() => {
      canDrop = true;
      spawnWaitingPlanet();
    }, 700);
  });
}

/***********************
 * TRAJECTORY PREVIEW (WITH WALL BOUNCE)
 ***********************/
function drawTrajectory() {
  if (!isAiming) return;

  const ctx = render.context;

  let dx = SPAWN_POINT.x - aimCurrent.x;
  let dy = SPAWN_POINT.y - aimCurrent.y;

  let len = Math.min(Math.hypot(dx, dy), MAX_STRETCH);
  let vx = (dx / (len || 1)) * ((len / MAX_STRETCH) * MAX_SPEED);
  let vy = (dy / (len || 1)) * ((len / MAX_STRETCH) * MAX_SPEED);

  let x = SPAWN_POINT.x;
  let y = SPAWN_POINT.y;

  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.moveTo(x, y);

  const steps = 30;

  for (let i = 0; i < steps; i++) {
    x += vx * 3;
    y += vy * 3;

    if (x < 20 || x > WIDTH - 20) {
      vx *= -1; // reflect on wall
      x = Math.max(20, Math.min(WIDTH - 20, x));
    }

    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/***********************
 * RESIZE HANDLER
 ***********************/
window.addEventListener('resize', () => {
  Render.stop(render);
  World.clear(engine.world);
  Engine.clear(engine);

  document.body.innerHTML = '';
  initGame();
});

/***********************
 * START
 ***********************/
document.body.style.margin = 0;
document.body.style.overflow = 'hidden';
initGame();
