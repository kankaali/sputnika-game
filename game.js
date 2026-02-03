/***********************
 * MATTER.JS IMPORTS
 ***********************/
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const World  = Matter.World;
const Bodies = Matter.Bodies;
const Body   = Matter.Body;

/***********************
 * GAME STATE
 ***********************/
let currentPlanet = null;
let canDrop = true;

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
 * RUNNER (IMPORTANT!)
 ***********************/
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

/***********************
 * BOUNDARIES (BUBBLE)
 ***********************/
const ground = Bodies.rectangle(200, 590, 400, 20, {
  isStatic: true,
  render: { fillStyle: '#1e293b' }
});

const leftWall  = Bodies.rectangle(0,   300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(400, 300, 20, 600, { isStatic: true });

World.add(engine.world, [ground, leftWall, rightWall]);

/***********************
 * PLANET DEFINITIONS
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
function createPlanet(x, y, level, isWaiting) {
  const p = PLANETS[level - 1];

  const body = Bodies.circle(x, y, p.radius, {
    restitution: 0.3,
    isStatic: isWaiting,
    inertia: isWaiting ? Infinity : undefined, // ⬅️ stops wobble
    render: { fillStyle: p.color }
  });

  body.level = level;
  World.add(engine.world, body);
  return body;
}

/***********************
 * SPAWN WAITING PLANET
 ***********************/
function spawnWaitingPlanet() {
  if (!canDrop) return;

  const level = Math.random() < 0.8 ? 1 : 2;
  currentPlanet = createPlanet(200, 60, level, true);
}

/***********************
 * PLAYER INPUT
 ***********************/
render.canvas.addEventListener('pointerdown', (e) => {
  if (!currentPlanet || !canDrop) return;

  const rect = render.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const clampedX = Math.max(30, Math.min(370, x));

  Body.setPosition(currentPlanet, { x: clampedX, y: 60 });
  Body.setStatic(currentPlanet, false);

  currentPlanet = null;
  canDrop = false;

  setTimeout(() => {
    canDrop = true;
    spawnWaitingPlanet();
  }, 400);
});

/***********************
 * INITIAL SPAWN
 ***********************/
spawnWaitingPlanet();
