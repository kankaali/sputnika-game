/***********************
 * MATTER.JS IMPORTS
 ***********************/
const Engine = Matter.Engine;
const Render = Matter.Render;
const World  = Matter.World;
const Bodies = Matter.Bodies;
const Body   = Matter.Body;
const Events = Matter.Events;

/***********************
 * GAME STATE
 ***********************/
let currentPlanet = null;   // Planet waiting to be dropped
let canDrop = true;         // Prevents spam clicking

/***********************
 * ENGINE & WORLD SETUP
 ***********************/
const engine = Engine.create();
engine.world.gravity.y = 1; // Natural gravity

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
  { level: 1, radius: 14, color: '#94a3b8' }, // Moon
  { level: 2, radius: 18, color: '#38bdf8' }, // Mercury
  { level: 3, radius: 22, color: '#22c55e' }, // Earth
  { level: 4, radius: 28, color: '#f59e0b' }  // Mars (temporary)
];

/***********************
 * CREATE PLANET
 * Used for both falling & waiting planets
 ***********************/
function createPlanet(x, y, level = 1, isStatic = false) {
  const p = PLANETS.find(pl => pl.level === level);

  const body = Bodies.circle(x, y, p.radius, {
    restitution: 0.4,
    isStatic: isStatic,
    label: 'planet',
    render: { fillStyle: p.color }
  });

  body.level = level;     // used later for merge logic
  body.radius = p.radius;

  World.add(engine.world, body);
  return body;
}

/***********************
 * SPAWN WAITING PLANET
 * Appears at top & waits for player input
 ***********************/
function spawnWaitingPlanet() {
  if (!canDrop) return;

  const level = Math.random() < 0.8 ? 1 : 2; // Mostly small planets
  currentPlanet = createPlanet(200, 60, level, true);
}

/***********************
 * PLAYER INPUT (DROP)
 ***********************/
document.addEventListener('pointerdown', (e) => {
  if (!currentPlanet || !canDrop) return;

  const rect = render.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;

  // Keep inside walls
  const clampedX = Math.max(30, Math.min(370, x));

  // Position & release
  Body.setPosition(currentPlanet, { x: clampedX, y: 60 });
  Body.setStatic(currentPlanet, false);

  currentPlanet = null;
  canDrop = false;

  // Spawn next planet after delay
  setTimeout(() => {
    canDrop = true;
    spawnWaitingPlanet();
  }, 500);
});

/***********************
 * INITIAL SPAWN
 ***********************/
spawnWaitingPlanet();

/***********************
 * START ENGINE
 ***********************/
Engine.run(engine);
Render.run(render);
