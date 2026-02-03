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

const planet = Bodies.circle(200, 100, 20, {
  restitution: 0.4,
  render: { fillStyle: '#38bdf8' }
});

World.add(engine.world, planet);

Engine.run(engine);
Render.run(render);
