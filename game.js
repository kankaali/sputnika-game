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
 * CONSTANTS
 ***********************/
const WIDTH = 400;
const HEIGHT = 600;
const SPAWN_POINT = { x: WIDTH / 2, y: 70 };
const MAX_STRETCH = 140;
const MAX_SPEED = 8;

/***********************
 * GAME STATE
 ***********************/
let currentPlanet = null;
let canDrop = true;
let isAiming = false;
let aimCurrent = { x: SPAWN_POINT.x, y: SPAWN_POINT.y };

/***********************
 * ENGINE & RENDER
 ***********************/
const engine = Engine.create();
engine.world.gravity.y = 1;

const render = Render.create({
  element: document.body,
  engine,
  options: {
    width: WIDTH,
    height: HEIGHT,
    wireframes: false,
    background: '#0b1026'
  }
});

const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

/***********************
 * WORLD BOUNDS
 ***********************/
const ground = Bodies.rectangle(WIDTH / 2, HEIGHT - 10, WIDTH, 20, {
  isStatic: true,
  render: { fillStyle: '#1e293b' }
});

const leftWall = Bodies.rectangle(10, HEIGHT / 2, 20, HEIGHT, { isStatic: true });
const rightWall = Bodies.rectangle(WIDTH - 10, HEIGHT / 2, 20, HEIGHT, { isStatic: true });

World.add(engine.world, [ground, leftWall, rightWall]);

/***********************
 * PLANETS
 ***********************/
const PLANETS = [
  { level: 1, radius: 14, color: '#94a3b8' },
  { level: 2, radius: 18, color: '#38bdf8' },
  { level: 3, radius: 22, color: '#22c55e' },
  { level: 4, radius: 28, color: '#f59e0b' }
];

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
 * LOCK PLANET WHILE AIMING
 ***********************/
Events.on(engine, 'beforeUpdate', () => {
  if (currentPlanet && isAiming) {
    Body.setVelocity(currentPlanet, { x: 0, y: 0 });
    Body.setPosition(currentPlanet, SPAWN_POINT);
  }
});

/***********************
 * UTIL
 ***********************/
function getCanvasPos(e) {
  const rect = render.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/***********************
 * INPUT
 ***********************/
render.canvas.addEventListener('pointerdown', (e) => {
  if (!currentPlanet || !canDrop) return;
  isAiming = true;
  aimCurrent = getCanvasPos(e);
});

render.canvas.addEventListener('pointermove', (e) => {
  if (!isAiming) return;
  aimCurrent = getCanvasPos(e);
});

window.addEventListener('pointerup', () => {
  if (!isAiming || !currentPlanet) return;

  let dx = SPAWN_POINT.x - aimCurrent.x;
  let dy = SPAWN_POINT.y - aimCurrent.y;

  let stretch = Math.hypot(dx, dy);
  stretch = Math.min(stretch, MAX_STRETCH);

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

/***********************
 * TRAJECTORY PREVIEW (WITH WALL BOUNCE)
 ***********************/
Events.on(render, 'afterRender', () => {
  if (!isAiming) return;

  const ctx = render.context;

  let dx = SPAWN_POINT.x - aimCurrent.x;
  let dy = SPAWN_POINT.y - aimCurrent.y;

  let len = Math.hypot(dx, dy);
  len = Math.min(len, MAX_STRETCH);

  const dirX = dx / (len || 1);
  const dirY = dy / (len || 1);

  const speed = (len / MAX_STRETCH) * MAX_SPEED;
  const travel = speed * 35;

  let x1 = SPAWN_POINT.x;
  let y1 = SPAWN_POINT.y;
  let x2 = x1 + dirX * travel;
  let y2 = y1 + dirY * travel;

  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  if (x2 < 20 || x2 > WIDTH - 20) {
    const wallX = x2 < 20 ? 20 : WIDTH - 20;
    const t = (wallX - x1) / (x2 - x1);
    const hitY = y1 + (y2 - y1) * t;

    const reflectX = -dirX;
    const remain = travel * (1 - t);

    ctx.lineTo(wallX, hitY);
    ctx.lineTo(wallX + reflectX * remain, hitY + dirY * remain);
  } else {
    ctx.lineTo(x2, y2);
  }

  ctx.stroke();
  ctx.setLineDash([]);
});

/***********************
 * START GAME
 ***********************/
spawnWaitingPlanet();
