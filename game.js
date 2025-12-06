const canvas = document.getElementById("renderCanvas");
let engine = new BABYLON.Engine(canvas, true);
let scene;
let player, camera;

let lane = 0;
let yVelocity = 0;
let isJumping = false;
let isSliding = false;
const GRAVITY = -0.015;
const JUMP_FORCE = 0.35;

// =====================================================================
// CREATE SCENE
// =====================================================================
function createScene() {
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.02, 0.05, 0.03);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 50, 0), scene);
  light.intensity = 1.2;

  camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 5, -12), scene);
  camera.radius = 12;
  camera.heightOffset = 5;
  camera.rotationOffset = 0;

  createGround();
  createPlayer();
  createUI();

  return scene;
}

// =====================================================================
// GROUND GENERATION
// =====================================================================
function createGround() {
  for (let i = 0; i < 40; i++) {
    const ground = BABYLON.MeshBuilder.CreateBox(
      "ground" + i,
      { width: 20, height: 0.4, depth: 20 },
      scene
    );
    ground.position.z = i * 20;

    const mat = new BABYLON.StandardMaterial("gmat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    ground.material = mat;
  }
}

// =====================================================================
// PLAYER = LOW POLY BEAR
// =====================================================================
function createPlayer() {
  player = BABYLON.MeshBuilder.CreateBox("bear", { height: 2, width: 1.2, depth: 2 }, scene);
  player.position.y = 1;
  player.position.z = 0;

  let mat = new BABYLON.StandardMaterial("bearMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
  player.material = mat;

  camera.lockedTarget = player;
}

// =====================================================================
// CONTROLS
// =====================================================================
let startX = 0, startY = 0;

window.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
  let dx = e.changedTouches[0].clientX - startX;
  let dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20) moveRight();
    else moveLeft();
  } else {
    if (dy < -20) jump();
    else slide();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp") jump();
  if (e.key === "ArrowDown") slide();
});

function moveLeft() { if (lane > -1) lane--; }
function moveRight() { if (lane < 1) lane++; }

function jump() {
  if (!isJumping) {
    yVelocity = JUMP_FORCE;
    isJumping = true;
  }
}

function slide() {
  if (!isSliding) {
    isSliding = true;
    setTimeout(() => (isSliding = false), 700);
  }
}

// =====================================================================
// PLAYER UPDATE
// =====================================================================
function updatePlayer() {
  player.position.x += (lane * 3 - player.position.x) * 0.2;
  player.position.z += 0.4;

  if (isJumping) {
    player.position.y += yVelocity;
    yVelocity += GRAVITY;

    if (player.position.y <= 1) {
      player.position.y = 1;
      yVelocity = 0;
      isJumping = false;
    }
  }
}

// =====================================================================
// OBSTACLES
// =====================================================================
let obstacles = [];
let lastGeneratedZ = 40;

function spawnObstacle(zPos) {
  const lanePick = [-1, 0, 1][Math.floor(Math.random() * 3)];
  const type = Math.floor(Math.random() * 3);

  let obs;

  if (type === 0) {
    obs = BABYLON.MeshBuilder.CreateCylinder("tree", { height: 4, diameter: 1.5 }, scene);
    obs.material = new BABYLON.StandardMaterial("tmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);

  } else if (type === 1) {
    obs = BABYLON.MeshBuilder.CreateSphere("rock", { diameter: 1.4 }, scene);
    obs.material = new BABYLON.StandardMaterial("rmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);

  } else {
    obs = BABYLON.MeshBuilder.CreateBox("log", { width: 2, height: 0.6, depth: 1 }, scene);
    obs.material = new BABYLON.StandardMaterial("lmat", scene);
    obs.material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
  }

  obs.position.x = lanePick * 3;
  obs.position.y = 1;
  obs.position.z = zPos;

  obstacles.push(obs);
}

function generateWorld() {
  while (player.position.z + 200 > lastGeneratedZ) {
    spawnObstacle(lastGeneratedZ + Math.random() * 15);
    spawnObstacle(lastGeneratedZ + Math.random() * 15);
    lastGeneratedZ += 20;
  }
}

// =====================================================================
// COLLISION + GAME OVER
// =====================================================================
function checkCollisions() {
  for (let o of obstacles) {
    let dx = Math.abs(player.position.x - o.position.x);
    let dz = Math.abs(player.position.z - o.position.z);

    if (dx < 1.2 && dz < 1.5 && player.position.y < 2) {
      gameOver();
      return;
    }
  }
}

function gameOver() {
  engine.stopRenderLoop();
  scoreText.text = "GAME OVER\nScore: " + Math.floor(score);

  let restartBtn = BABYLON.GUI.Button.CreateSimpleButton("restart", "Restart");
  restartBtn.width = "200px";
  restartBtn.height = "60px";
  restartBtn.color = "white";
  restartBtn.background = "red";
  restartBtn.top = "80px";
  uiTexture.addControl(restartBtn);

  restartBtn.onPointerUpObservable.add(() => {
    location.reload();
  });
}

// =====================================================================
// SCORE UI
// =====================================================================
function createUI() {
  uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  scoreText = new BABYLON.GUI.TextBlock();
  scoreText.text = "Score: 0";
  scoreText.color = "white";
  scoreText.fontSize = 28;
  scoreText.top = "-45%";
  scoreText.left = "-40%";
  scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

  uiTexture.addControl(scoreText);
}

// =====================================================================
// GAME LOOP
// =====================================================================
scene = createScene();

engine.runRenderLoop(() => {
  updatePlayer();
  generateWorld();
  checkCollisions();

  score += 0.3;
  scoreText.text = "Score: " + Math.floor(score);

  scene.render();
});

window.addEventListener("resize", () => engine.resize());

// SPLASH
document.getElementById("startBtn").onclick = () => {
  document.getElementById("splash").style.display = "none";
};
