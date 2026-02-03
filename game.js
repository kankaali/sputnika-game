/***********************
 * MATTER.JS IMPORTS
 ***********************/
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const World  = Matter.World;
const Bodies = Matter.Bodies;
const Body   = Matter.Body;
const Events = Matter.Events;

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
 * PLANETS
 ***********************/
const PLANETS = [
  { level: 1, radius: 14, color: '#94a3b8' },
  { level: 2, radius: 18, color: '#38bdf8' },
  { level: 3, radius: 22, color: '#22c55e' },
  { level: 4, radius: 28, color: '#f59e0b' }
];

/***********************
 * CONSTANTS
 ***********************/
const MAX_STRETCH = 150;
const MAX_SPEED = 9;

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
  engine.world.gravity.y = 1;

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
  bindEvents();
  spawnWaitingPlanet();
}

/***********************
 * WORLD BOUNDS
 ***********************/
function createBounds() {
  const thickness = 40;

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
  const body = Bodies.circle(SPAWN_POINT.x, SPAWN_POINT.y, p.radius, {
    restitution: 0.3,
    isStatic: true,
    inertia: Infinity,
    render: { fillStyle: p.color }
  });
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
 * LOCK PLANET
 ***********************/
Events.on(engine, 'beforeUpdate', () => {
  if (currentPlanet && isAiming) {
    Body.setVelocity(currentPlanet, { x: 0, y: 0 });
    Body.setPosition(currentPlanet, SPAWN_POINT);
  }
});

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
function bindEvents() {
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

    let stretch = Math.min(Math.hypot(dx, dy), MAX_STRETCH);
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

  Events.on(render, 'afterRender', drawTrajectory);
}

/***********************
 * TRAJECTORY PREVIEW (BOUNCE)
 ***********************/
function drawTrajectory() {
  if (!isAiming) return;

  const ctx = render.context;

  let dx = SPAWN_POINT.x - aimCurrent.x;
  let dy = SPAWN_POINT.y - aimCurrent.y;
  let len = Math.min(Math.hypot(dx, dy), MAX_STRETCH);

  const dirX = dx / (len || 1);
  const dirY = dy / (len || 1);
  const speed = (len / MAX_STRETCH) * MAX_SPEED;
  const travel = speed * 40;

  let x1 = SPAWN_POINT.x;
  let y1 = SPAWN_POINT.y;
  let x2 = x1 + dirX * travel;
  let y2 = y1 + dirY * travel;

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  const margin = 20;

  if (x2 < margin || x2 > WIDTH - margin) {
    const wallX = x2 < margin ? margin : WIDTH - margin;
    const t = (wallX - x1) / (x2 - x1);
    const hitY = y1 + (y2 - y1) * t;

    const remain = travel * (1 - t);

    ctx.lineTo(wallX, hitY);
    ctx.lineTo(wallX - dirX * remain, hitY + dirY * remain);
  } else {
    ctx.lineTo(x2, y2);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/***********************
 * HANDLE RESIZE
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
