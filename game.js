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
let currentPlanet = null;
let canDrop = true;

// AIMING STATE
let isAiming = false;
let aimStart = { x: 200, y: 60 };
let aimCurrent = { x: 200, y: 60 };

/***********************
 * ENGINE & RENDER
 ***********************/
const engine = Engine.create();
engine.world.gravity.y = 1;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 400,
    height: 600,
    wireframes: false,
    background: '#0b1026'
  }
});

/***********************
 * RUNNER
 ***********************/
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

/***********************
 * BOUNDARIES
 ***********************/
const ground = Bodies.rectangle(200, 590, 400, 20, {
  isStatic: true,
  render: { fillStyle: '#1e293b' }
});

const leftWall  = Bodies.rectangle(0, 300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(400, 300, 20, 600, { isStatic: true });

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

/***********************
 * CREATE PLANET
 ***********************/
function createPlanet(level) {
  const p = PLANETS[level - 1];

  const body = Bodies.circle(200, 60, p.radius, {
    restitution: 0.3,
    isStatic: true,
    inertia: Infinity,
    render: { fillStyle: p.color }
  });

  body.level = level;
  World.add(engine.world, body);
  return body;
}

/***********************
 * SPAWN PLANET (CENTER ONLY)
 ***********************/
function spawnWaitingPlanet() {
  if (!canDrop) return;

  const level = Math.random() < 0.8 ? 1 : 2;
  currentPlanet = createPlanet(level);
}

/***********************
 * LOCK WAITING PLANET
 ***********************/
Events.on(engine, 'beforeUpdate', () => {
  if (currentPlanet && isAiming) {
    Body.setVelocity(currentPlanet, { x: 0, y: 0 });
    Body.setPosition(currentPlanet, aimStart);
  }
});

/***********************
 * DRAW TRAJECTORY PREVIEW
 ***********************/
Events.on(render, 'afterRender', () => {
  if (!isAiming) return;

  const ctx = render.context;
  const dx = aimStart.x - aimCurrent.x;
  const dy = aimStart.y - aimCurrent.y;

  ctx.beginPath();
  ctx.setLineDash([5, 6]);
  ctx.moveTo(aimStart.x, aimStart.y);
  ctx.lineTo(
    aimStart.x + dx * 2,
    aimStart.y + dy * 2
  );
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
});

/***********************
 * INPUT: START AIM
 ***********************/
render.canvas.addEventListener('pointerdown', (e) => {
  if (!currentPlanet || !canDrop) return;

  isAiming = true;

  const rect = render.canvas.getBoundingClientRect();
  aimCurrent.x = e.clientX - rect.left;
  aimCurrent.y = e.clientY - rect.top;
});

/***********************
 * INPUT: AIM DRAG
 ***********************/
render.canvas.addEventListener('pointermove', (e) => {
  if (!isAiming) return;

  const rect = render.canvas.getBoundingClientRect();
  aimCurrent.x = e.clientX - rect.left;
  aimCurrent.y = e.clientY - rect.top;
});

/***********************
 * INPUT: RELEASE → SHOOT
 ***********************/
render.canvas.addEventListener('pointerup', () => {
  if (!isAiming || !currentPlanet) return;

  const dx = aimStart.x - aimCurrent.x;
  const dy = aimStart.y - aimCurrent.y;

  const power = 0.08; // tweak later

  Body.setStatic(currentPlanet, false);
  Body.setVelocity(currentPlanet, {
    x: dx * power,
    y: dy * power
  });

  currentPlanet = null;
  isAiming = false;
  canDrop = false;

  setTimeout(() => {
    canDrop = true;
    spawnWaitingPlanet();
  }, 800);
});

/***********************
 * INITIAL SPAWN
 ***********************/
spawnWaitingPlanet();
