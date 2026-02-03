const Engine = Matter.Engine;
const Render = Matter.Render;
const World  = Matter.World;
const Bodies = Matter.Bodies;

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

const ground = Bodies.rectangle(200, 590, 400, 20, {
  isStatic: true,
  render: { fillStyle: '#1e293b' }
});

const leftWall = Bodies.rectangle(0, 300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(400, 300, 20, 600, { isStatic: true });

World.add(engine.world, [ground, leftWall, rightWall]);

const PLANETS = [
  { level: 1, radius: 14, color: '#94a3b8' }, // Moon
  { level: 2, radius: 18, color: '#38bdf8' }, // Mercury
  { level: 3, radius: 22, color: '#22c55e' }, // Earth
  { level: 4, radius: 28, color: '#f59e0b' }  // Mars (for now)
];

function createPlanet(x, y, level = 1) {
  const p = PLANETS.find(p => p.level === level);

  const body = Bodies.circle(x, y, p.radius, {
    restitution: 0.4,
    label: 'planet',
    render: { fillStyle: p.color }
  });

  body.level = level;   // 🔑 VERY IMPORTANT
  body.radius = p.radius;

  World.add(engine.world, body);
  return body;
}

// spawn one to test
createPlanet(200, 100, 1);

Engine.run(engine);
Render.run(render);
