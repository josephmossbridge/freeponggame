// Select canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Get the audio element and define mapping of modes to audio files.
const bgMusic = document.getElementById("bgMusic");
const audioMapping = {
  "Easy": "1.m4a",
  "Medium": "2.m4a",
  "Hard": "3.m4a",
  "Insane": "4.m4a",
  "UltraInsane": "5.m4a",
  "Insaniest": "6.m4a",
  "BigBall": "7.m4a",
  "Trippy": "8.m4a",
  "Gravity": "9.m4a",
  "Art": "0.m4a"
};

// Paddle properties
const paddleWidth = 10;
const paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const playerSpeed = 5;
// Global variable for player paddle velocity (set in key events)
let playerVelocity = 0;
// For AI, we'll compute velocity using the difference between frames:
let lastAiY = aiY;

// Base ball properties
const baseBallSpeedX = 6.3, baseBallSpeedY = 6.3;
let ballSpeedX = 0, ballSpeedY = 0;
let ballRadius = 8;
let ballX = canvas.width / 2, ballY = canvas.height / 2;

// Game state
let playerScore = 0, aiScore = 0;
let maxScore = 5;
let gameOver = false;
let gameStarted = false;
let pointPause = false;

// Trippy mode variables
let currentPaddleHeight = paddleHeight;
let lastTrippyUpdate = 0;
let trippyInterval = 0;
let extraBalls = [];

// Art mode variables
let artTrail = [];
let artHue = 0;

// AI modes and difficulties
const difficulties = {
  "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.8 },
  "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
  "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.3 },
  "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 },
  "UltraInsane": { aiReaction: 2.0, ballSpeedMultiplier: 3.0 },
  "Insaniest": { aiReaction: 3.0, ballSpeedMultiplier: 4.5 },
  "BigBall": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
  "Trippy": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
  "Gravity": { aiReaction: 1.0, ballSpeedMultiplier: 1.0, gravity: 0.3 },
  "Art": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 }
};
let aiDifficulty = "Medium";

// Player movement tracking
let moveUp = false, moveDown = false;

// Function to start the game when spacebar is pressed.
function startGame() {
  if (!gameStarted) {
    // Set default mode to Medium.
    aiDifficulty = "Medium";
    bgMusic.src = "audio/" + audioMapping["Medium"];
    bgMusic.load();
    bgMusic.play().catch(err => console.log("Audio playback error:", err));
    gameStarted = true;
    resetBall();
    gameLoop();
  }
}

// Main game loop.
function gameLoop() {
  // Update Trippy mode effects.
  if (aiDifficulty === "Trippy") {
    const now = Date.now();
    if (!lastTrippyUpdate || now - lastTrippyUpdate >= trippyInterval) {
      // Randomize paddle height (for both paddles, via currentPaddleHeight)
      currentPaddleHeight = 30 + Math.random() * 170;
      // Randomize ball size.
      ballRadius = 8 + Math.random() * 32;
      // Randomize ball speeds while preserving its horizontal direction.
      ballSpeedX = (ballSpeedX >= 0 ? 1 : -1) * (baseBallSpeedX * (0.8 + Math.random() * 0.4));
      ballSpeedY = (ballSpeedY >= 0 ? 1 : -1) * (baseBallSpeedY * (0.8 + Math.random() * 0.4));
      // Randomize next update interval between 1-3 seconds.
      trippyInterval = 1000 + Math.random() * 2000;
      lastTrippyUpdate = now;
    }
  } else {
    currentPaddleHeight = paddleHeight;
  }
  
  if (aiDifficulty === "Art") {
    updateArtTrail();
  }
  
  updateExtraBalls();
  
  if (!pointPause) {
    // For AI, compute velocity as difference since last frame.
    let aiVelocity = aiY - lastAiY;
    moveSingle(playerVelocity, aiVelocity);
  }
  
  draw();
  // Update lastAiY for next frame.
  lastAiY = aiY;
  requestAnimationFrame(gameLoop);
}

// Art mode: update persistent rainbow trail.
function updateArtTrail() {
  artHue = (artHue + 2) % 360;
  artTrail.push({ x: ballX, y: ballY, color: `hsl(${artHue}, 100%, 50%)` });
}

// Update extra mini balls for Trippy mode.
function updateExtraBalls() {
  for (let i = extraBalls.length - 1; i >= 0; i--) {
    let b = extraBalls[i];
    b.x += b.vx;
    b.y += b.vy;
    b.alpha -= 0.02;
    if (b.alpha <= 0) extraBalls.splice(i, 1);
  }
}

// Single-ball movement logic.
function moveSingle(playerVel, aiVel) {
  if (aiDifficulty === "Gravity") {
    ballSpeedY += difficulties["Gravity"].gravity;
  }
  
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  
  if (ballY - ballRadius < 0) {
    ballY = ballRadius;
    ballSpeedY = Math.abs(ballSpeedY);
  }
  
  if (ballY + ballRadius > canvas.height) {
    ballY = canvas.height - ballRadius;
    if (aiDifficulty === "Gravity") {
      ballSpeedY = -(Math.abs(ballSpeedY) + difficulties["Gravity"].gravity);
    } else {
      ballSpeedY *= -1;
      ballSpeedX *= 1.1;
    }
  }
  
  if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
    ballX = 20 + ballRadius;
    ballSpeedX = Math.abs(ballSpeedX);
    ballSpeedY += playerVel * 0.3;
    if (aiDifficulty === "UltraInsane") {
      ballSpeedX *= 1.2;
      ballSpeedY *= 1.2;
    } else if (aiDifficulty === "Insaniest") {
      ballSpeedX *= 1.3;
      ballSpeedY *= 1.3;
    }
  }
  
  if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
    ballX = canvas.width - 20 - ballRadius;
    ballSpeedX = -Math.abs(ballSpeedX);
    ballSpeedY += aiVel * 0.3;
    if (aiDifficulty === "UltraInsane") {
      ballSpeedX *= 1.2;
      ballSpeedY *= 1.2;
    } else if (aiDifficulty === "Insaniest") {
      ballSpeedX *= 1.3;
      ballSpeedY *= 1.3;
    }
  }
  
  if (ballX - ballRadius < 0) {
    aiScore++;
    if (aiScore === maxScore) { endGame("lose"); return; }
    else { pointPause = true; setTimeout(() => { resetBall(); pointPause = false; }, 1000); return; }
  } else if (ballX + ballRadius > canvas.width) {
    playerScore++;
    if (playerScore === maxScore) { endGame("win"); return; }
    else { pointPause = true; setTimeout(() => { resetBall(); pointPause = false; }, 1000); return; }
  }
  
  if (aiDifficulty === "Gravity") {
    let targetX = canvas.width - 20 - ballRadius;
    let tPred = (ballSpeedX > 0) ? (targetX - ballX) / ballSpeedX : 0;
    if (tPred > 60) tPred = 60;
    let g = difficulties["Gravity"].gravity;
    let predictedY = ballY + ballSpeedY * tPred + 0.5 * g * tPred * tPred;
    predictedY = Math.max(ballRadius, Math.min(canvas.height - ballRadius, predictedY));
    let paddleCenter = aiY + paddleHeight / 2;
    let diff = predictedY - paddleCenter;
    let desiredMove = diff * difficulties["Gravity"].aiReaction;
    let maxMove = playerSpeed;
    if (desiredMove > maxMove) desiredMove = maxMove;
    if (desiredMove < -maxMove) desiredMove = -maxMove;
    aiY += desiredMove;
  } else {
    let aiReactionSpeed = difficulties[aiDifficulty].aiReaction;
    if (aiY + paddleHeight / 2 < ballY - 10) {
      aiY += playerSpeed * aiReactionSpeed;
    } else if (aiY + paddleHeight / 2 > ballY + 10) {
      aiY -= playerSpeed * aiReactionSpeed;
    }
  }
  
  let effectivePlayerSpeed = playerSpeed;
  if (aiDifficulty === "UltraInsane" || aiDifficulty === "Insaniest") {
    effectivePlayerSpeed = playerSpeed * 1.5;
  }
  if (moveUp && playerY > 0) playerY -= effectivePlayerSpeed;
  if (moveDown && playerY < canvas.height - paddleHeight) playerY += effectivePlayerSpeed;
}

// Modernized drawing function.
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // If game hasn't started, display the start message.
  if (!gameStarted) {
    ctx.fillStyle = "#fff";
    ctx.font = "30px Roboto";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACEBAR to Start", canvas.width / 2, canvas.height / 2);
    return;
  }
  
  if (aiDifficulty === "Art") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    artTrail.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (aiDifficulty === "Trippy") {
    let hue = Math.floor(Math.random() * 360);
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#000");
    bgGradient.addColorStop(1, "#111");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  
  // Player paddle with randomized height in Trippy mode.
  let paddleH = (aiDifficulty === "Trippy" ? currentPaddleHeight : paddleHeight);
  let paddleGradient = ctx.createLinearGradient(0, playerY, 0, playerY + paddleH);
  paddleGradient.addColorStop(0, "#4CAF50");
  paddleGradient.addColorStop(1, "#2E7D32");
  ctx.fillStyle = paddleGradient;
  ctx.fillRect(10, playerY, paddleWidth, paddleH);
  
  // AI paddle.
  let aiPaddleGradient = ctx.createLinearGradient(0, aiY, 0, aiY + paddleH);
  aiPaddleGradient.addColorStop(0, "#F44336");
  aiPaddleGradient.addColorStop(1, "#B71C1C");
  ctx.fillStyle = aiPaddleGradient;
  ctx.fillRect(canvas.width - 20, aiY, paddleWidth, paddleH);
  ctx.restore();
  
  // Draw the ball (solid white circle).
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Extra mini balls for Trippy mode.
  if (aiDifficulty === "Trippy") {
    extraBalls.forEach(b => {
      ctx.fillStyle = `rgba(255,255,255,${b.alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    if (Math.random() < 0.1) {
      extraBalls.push({
        x: ballX,
        y: ballY,
        radius: 3 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        alpha: 1.0
      });
    }
  }
  
  // Draw score and mode.
  ctx.fillStyle = "#fff";
  ctx.font = "20px Roboto";
  ctx.textAlign = "left";
  ctx.fillText(`Player: ${playerScore}`, 20, 30);
  ctx.textAlign = "right";
  ctx.fillText(`AI: ${aiScore}`, canvas.width - 20, 30);
  ctx.textAlign = "center";
  ctx.fillText(`Mode: ${aiDifficulty}`, canvas.width / 2, 30);
  
  // Game Over overlay.
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "40px Roboto";
    ctx.textAlign = "center";
    ctx.fillText(gameOver === "win" ? "🎉 YOU WIN! 🎉" : "😞 YOU LOSE! 😞", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Roboto";
    ctx.fillText("Press SPACEBAR to Restart", canvas.width / 2, canvas.height / 2 + 40);
  }
}

// Reset the ball.
function resetBall() {
  if (aiDifficulty === "BigBall") {
    ballRadius = 40;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * difficulties["BigBall"].ballSpeedMultiplier;
    ballSpeedY = (Math.random() * 6 - 3) * difficulties["BigBall"].ballSpeedMultiplier;
  } else if (aiDifficulty === "Gravity") {
    ballRadius = 8;
    let speedMultiplier = difficulties["Gravity"].ballSpeedMultiplier;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
    ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
  } else {
    ballRadius = 8;
    let speedMultiplier = difficulties[aiDifficulty].ballSpeedMultiplier;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
    ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
  }
  
  if (aiDifficulty !== "Art") {
    artTrail = [];
  }
}

// Change mode/difficulty and update background music.
function setDifficulty(level) {
  if (difficulties[level]) {
    aiDifficulty = level;
    console.log("Mode set to: " + aiDifficulty);
    extraBalls = [];
    maxScore = 5;
    if (aiDifficulty === "Art") {
      artTrail = [];
      artHue = 0;
    }
    resetGame();
    if (bgMusic) {
      bgMusic.src = "audio/" + audioMapping[aiDifficulty];
      bgMusic.load();
      bgMusic.play().catch(err => console.log("Audio playback error:", err));
    }
  } else {
    console.log("No mode for: " + level);
  }
}

// End the game.
function endGame(result) {
  gameOver = result;
  ballSpeedX = 0;
  ballSpeedY = 0;
}

// Reset game state.
function resetGame() {
  playerScore = 0;
  aiScore = 0;
  gameOver = false;
  gameStarted = true;
  resetBall();
}

function handleKeydown(event) {
  if (["ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault(); // Prevent scrolling
  }

  console.log("Key pressed: " + event.key);
  
  if (event.key.toLowerCase() === "m") {
    bgMusic.muted = !bgMusic.muted;
  }
  if (event.key === "ArrowUp") {
    moveUp = true;
    playerVelocity = -(aiDifficulty === "UltraInsane" || aiDifficulty === "Insaniest" ? playerSpeed * 1.5 : playerSpeed);
  }
  if (event.key === "ArrowDown") {
    moveDown = true;
    playerVelocity = (aiDifficulty === "UltraInsane" || aiDifficulty === "Insaniest" ? playerSpeed * 1.5 : playerSpeed);
  }
  if ((event.key === " " || event.code === "Space" || event.keyCode === 32) && !gameStarted) {
    startGame();
  }
  if ((event.key === " " || event.code === "Space" || event.keyCode === 32) && gameOver) {
    resetGame();
  }
  if (event.key === "1") setDifficulty("Easy");
  if (event.key === "2") setDifficulty("Medium");
  if (event.key === "3") setDifficulty("Hard");
  if (event.key === "4") setDifficulty("Insane");
  if (event.key === "5") setDifficulty("UltraInsane");
  if (event.key === "6") setDifficulty("Insaniest");
  if (event.key === "7" || event.key === "Numpad7") setDifficulty("BigBall");
  if (event.key === "8" || event.key === "Numpad8") setDifficulty("Trippy");
  if (event.key === "9" || event.key === "Numpad9") setDifficulty("Gravity");
  if (event.key === "0" || event.key === "Numpad0") setDifficulty("Art");
}


function handleKeyup(event) {
  if (event.key === "ArrowUp") {
    moveUp = false;
    playerVelocity = 0;
  }
  if (event.key === "ArrowDown") {
    moveDown = false;
    playerVelocity = 0;
  }
}

document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

// Draw the initial screen.
draw();
