const canvas = document.getElementById("renderCanvas");
let engine = new BABYLON.Engine(canvas, true);
let scene, player, camera;

// Player State
let lane = 0;
let yVelocity = 0;
let isJumping = false;
let isSliding = false;

const GRAVITY = -0.02;
const JUMP_FORCE = 0.38;

// =====================================================================
// SCENE SETUP
// =====================================================================
function createScene() {
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.02, 0.05, 0.03);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 50, 0),
    scene
  );
  light.intensity = 1.2;

  camera = new BABYLON.FollowCamera(
    "camera",
    new BABYLON.Vector3(0, 6, -12),
    scene
  );

  camera.radius = 12;
  camera.heightOffset = 5;
  camera.rotationOffset = 0;

  createGround();
  createPlayer();
  createUI();

  return scene;
}

// =====================================================================
// PLAYER
// =====================================================================
function createPlayer() {
  player = BABYLON.MeshBuilder.CreateBox(
    "bear",
    { height: 2, width: 1.4, depth: 2 },
    scene
  );
  player.position.y = 1;
  player.position.z = 0;

  const mat = new BABYLON.StandardMaterial("bearMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
  player.material = mat;

  camera.lockedTarget = player;
}

// =====================================================================
// GROUND
// =====================================================================
function createGround() {
  for (let i = 0; i < 50; i++) {
    const ground = BABYLON.MeshBuilder.CreateBox(
      "g" + i,
      { width: 20, height: 0.4, depth: 20 },
      scene
    );
    ground.position.z = i * 20;

    const gmat = new BABYLON.StandardMaterial("gm", scene);
    gmat.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    ground.material = gmat;
  }
}

// =====================================================================
// MOVEMENT CONTROLS
// =====================================================================
function moveLeft() {
  if (lane > -1) lane--;
}
function moveRight() {
  if (lane < 1) lane++;
}

function jump() {
  if (!isJumping) {
    isJumping = true;
    yVelocity = JUMP_FORCE;
  }
}

function slide() {
  if (!isSliding) {
    isSliding = true;
    setTimeout(() => (isSliding = false), 600);
  }
}

// Touch controls
let sx = 0,
  sy = 0;

window.addEventListener("touchstart", (e) => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
  let dx = e.changedTouches[0].clientX - sx;
  let dy = e.changedTouches[0].clientY - sy;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20) moveRight();
    else moveLeft();
  } else {
    if (dy < -20) jump();
    else slide();
  }
});

// =====================================================================
// OBSTACLES
// =====================================================================
let obstacles = [];
let lastZ = 40;

function spawnObstacle(zPos) {
  const lanePick = [-1, 0, 1][Math.floor(Math.random() * 3)];
  const type = Math.floor(Math.random() * 3);

  let obs;

  if (type === 0) {
    obs = BABYLON.MeshBuilder.CreateCylinder(
      "tree",
      { height: 4, diameter: 1.5 },
      scene
    );
    obs.material = new BABYLON.StandardMaterial("tmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);
  } else if (type === 1) {
    obs = BABYLON.MeshBuilder.CreateSphere(
      "rock",
      { diameter: 1.4 },
      scene
    );
    obs.material = new BABYLON.StandardMaterial("rmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  } else {
    obs = BABYLON.MeshBuilder.CreateBox(
      "log",
      { width: 2, height: 0.6, depth: 1 },
      scene
    );
    obs.material = new BABYLON.StandardMaterial("lmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
  }

  obs.position.x = lanePick * 3;
  obs.position.y = 1;
  obs.position.z = zPos;

  obstacles.push(obs);
}

function generateWorld() {
  while (player.position.z + 150 > lastZ) {
    spawnObstacle(lastZ + Math.random() * 15);
    spawnObstacle(lastZ + Math.random() * 15);
    lastZ += 20;
  }
}

// =====================================================================
// COLLISION
// =====================================================================
function checkCollision() {
  for (let o of obstacles) {
    if (
      Math.abs(player.position.x - o.position.x) < 1.4 &&
      Math.abs(player.position.z - o.position.z) < 1.5 &&
      player.position.y < 2
    ) {
      gameOver();
    }
  }
}

// =====================================================================
// SCORE UI
// =====================================================================
let uiTex, scoreText;
let score = 0;

function createUI() {
  uiTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  scoreText = new BABYLON.GUI.TextBlock();
  scoreText.text = "Score: 0";
  scoreText.color = "white";
  scoreText.fontSize = 28;
  scoreText.top = "-45%";
  scoreText.left = "-40%";
  scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

  uiTex.addControl(scoreText);
}

// =====================================================================
// GAME LOOP
// =====================================================================
scene = createScene();

engine.runRenderLoop(() => {
  player.position.x += (lane * 3 - player.position.x) * 0.2;

  player.position.z += 0.35;

  if (isJumping) {
    player.position.y += yVelocity;
    yVelocity += GRAVITY;

    if (player.position.y <= 1) {
      player.position.y = 1;
      yVelocity = 0;
      isJumping = false;
    }
  }

  generateWorld();
  checkCollision();

  score += 0.3;
  scoreText.text = "Score: " + Math.floor(score);

  scene.render();
});

window.addEventListener("resize", () => engine.resize());

// =====================================================================
// GAME OVER
// =====================================================================
function gameOver() {
  engine.stopRenderLoop();

  scoreText.text = "GAME OVER\nScore: " + Math.floor(score);

  let restart = BABYLON.GUI.Button.CreateSimpleButton(
    "restart",
    "Restart"
  );
  restart.width = "200px";
  restart.height = "60px";
  restart.color = "white";
  restart.background = "red";
  restart.top = "50px";
  uiTex.addControl(restart);

  restart.onPointerUpObservable.add(() => {
    location.reload();
  });
}

// =====================================================================
// SPLASH BUTTON
// =====================================================================
document.getElementById("startBtn").onclick = () => {
  document.getElementById("splash").style.display = "none";
};
