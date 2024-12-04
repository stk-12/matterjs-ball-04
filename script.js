
// 使用モジュール
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  Events = Matter.Events,
  Body = Matter.Body;

// エンジンの生成
const engine = Engine.create({
  gravity: { // 重力設定
    scale: 0.0,
    // x: 0.5,
    y: 0.05,
  },
});
const world = engine.world;

// セッティング
const settings = {
  ball: {
    count: 18,
    radius: Math.min(window.innerWidth, window.innerHeight) * 0.04,
    options: {
      restitution: 0.9,
      render: {
        // sprite: {
        //   texture: './ball.png',
        //   xScale: 0.5,
        //   yScale: 0.5
        // }
      }
    }
  },
  mouseBall: {
    radius: 30,
    options: {
      restitution: 0.9,
      render: {
        fillStyle: '#FFFFFF',
        opacity: 0,
      }
    }
  },
  wall: {
    size: 20,
    options: { isStatic: true, render: { opacity: 0 } }
  },
  pin: {
    radius: Math.min(window.innerWidth, window.innerHeight) * 0.25,
    options: { isStatic: true, render: { fillStyle: '#ffffff' } }
  },
}

// レンダラーの生成
const render = Render.create({
  element: document.querySelector('.js-canvas'),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false, // ワイヤーフレーム
    background: null, // 背景色を透明
  }
});

// ボールの生成
const createBalls = (count) => {
  const balls = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const radius = settings.ball.radius * (Math.random() + 1.0);
    const ball = Bodies.circle(x, y, radius, settings.ball.options);
    // ランダムな速度を設定
    Matter.Body.setVelocity(ball, { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
    balls.push(ball);
  }
  return balls;
}

// マウス追従ボール
const mouseBall = Bodies.circle(10, 10, settings.mouseBall.radius, settings.mouseBall.options);

// 壁とピンの生成
const createWallsAndPins = () => [
  Bodies.rectangle(window.innerWidth / 2, 0, window.innerWidth, settings.wall.size, settings.wall.options), // 上の壁
  Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, settings.wall.size, settings.wall.options), // 下の壁
  Bodies.rectangle(window.innerWidth, window.innerHeight / 2, settings.wall.size, window.innerHeight, settings.wall.options), // 右の壁
  Bodies.rectangle(0, window.innerHeight / 2, settings.wall.size, window.innerHeight, settings.wall.options), // 左の壁
  Bodies.circle(window.innerWidth / 2, window.innerHeight / 2, settings.pin.radius, settings.pin.options),
];

// ワールドにすべてのボディ（オブジェクト）を追加
const balls = createBalls(settings.ball.count);
Composite.add(world, [...balls, ...createWallsAndPins(), mouseBall]);


// マウス制御
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
        visible: false
    }
  }
});

// balls のドラッグを無効化
Events.on(mouseConstraint, "startdrag", (event) => {
  if (balls.includes(event.body)) {
    // balls のドラッグを無効化
    mouseConstraint.constraint.bodyB = null;
  }
});

Composite.add(world, mouseConstraint);


Events.on(engine, "beforeUpdate", () => {
  const mousePosition = mouse.position;

  // ボールにマウスを追従させる力を加える
  const deltaX = mousePosition.x - mouseBall.position.x;
  const deltaY = mousePosition.y - mouseBall.position.y;

  // 力の強さを調整
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const maxDistance = 50; // 力を適用する最大距離

  if (distance > 1) { // 最小距離以下なら力を加えない
    const forceMagnitude = Math.min(distance / maxDistance, 1) * 0.0002; // 距離に基づいて力を調整
    const force = {
      x: deltaX * forceMagnitude,
      y: deltaY * forceMagnitude
    };

    Body.applyForce(mouseBall, mouseBall.position, force);
  }

  // 減衰効果を適用
  const damping = 0.88; // 減衰率
  Body.setVelocity(mouseBall, {
    x: mouseBall.velocity.x * damping,
    y: mouseBall.velocity.y * damping
  });
});


// レンダラーとエンジンの実行
Render.run(render);
var runner = Runner.create();
Runner.run(runner, engine);


document.addEventListener('click', (event) => {
  // クリック位置を取得
  const mousePosition = { x: event.clientX, y: event.clientY };

  // クリック位置がボールの範囲内にあるかチェック
  const clickedBodies = Matter.Query.point([...balls], mousePosition);

  clickedBodies.forEach((ball) => {
    // ボールの中心位置とクリック位置の差をベクトルで取得
    const deltaX = ball.position.x - mousePosition.x; // x方向を反転
    const deltaY = ball.position.y - mousePosition.y; // y方向を反転
    const forceMagnitude = 0.02; // 力の大きさ

    const force = { x: deltaX * forceMagnitude, y: deltaY * forceMagnitude };
    Body.applyForce(ball, ball.position, force);
  });
});

// クリック時にmouseBallを復活させる
document.addEventListener('click', () => {
  // mouseBallが画面外に出ているか確認
  const isOutOfBounds =
    mouseBall.position.x < 0 ||
    mouseBall.position.x > window.innerWidth ||
    mouseBall.position.y < 0 ||
    mouseBall.position.y > window.innerHeight;

  if (isOutOfBounds) {
    // mouseBallの位置を中央に復活させる
    Body.setPosition(mouseBall, { x: window.innerWidth / 2, y: window.innerHeight / 2 });

    // 速度をリセット
    Body.setVelocity(mouseBall, { x: 0, y: 0 });

  }
});

// リサイズ設定
window.addEventListener('resize', () => {
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  Composite.clear(world, false, true);
  Composite.add(world, [balls, ...createWallsAndPins()]);
});