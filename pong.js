// Select canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10;
const paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const playerSpeed = 5;
let lastPlayerY = playerY;

// Ball properties (for single-ball modes)
const baseBallSpeedX = 6.3, baseBallSpeedY = 6.3;
let ballSpeedX = 0, ballSpeedY = 0;
let ballRadius = 8;

// Scoring & game state
let playerScore = 0, aiScore = 0;
let maxScore = 5; // Default winning score
let gameOver = false;
let gameStarted = false;
let paused = false;  // Paused state after a point is scored

// Variables for Trippy mode effects
let currentPaddleHeight = paddleHeight;
let lastTrippyUpdate = 0;
let trippyInterval = 0;

// Array for extra mini balls (for Trippy mode)
let extraBalls = [];

// AI Difficulty Levels and Modes (Infinite mode removed)
const difficulties = {
  "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.72 },
  "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
  "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.17 },
  "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 },
  "UltraInsane": { aiReaction: 2.0, ballSpeedMultiplier: 3.0 },
  "Insaniest": { aiReaction: 3.0, ballSpeedMultiplier: 4.5 },
  "BigBall": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
  "Trippy": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 }
};
let aiDifficulty = "Medium"; // Default mode

// Player movement tracking
let moveUp = false, moveDown = false;

// Main game loop
function gameLoop() {
  // If the game is paused (after a point), skip updating movement.
  if (!paused) {
    // For Trippy mode, update effects every 1–3 seconds.
    if (aiDifficulty === "Trippy") {
      const now = Date.now();
      if (!lastTrippyUpdate || now - lastTrippyUpdate >= trippyInterval) {
        currentPaddleHeight = 30 + Math.random() * 170; // Between 30 and 200
        ballRadius = 8 + Math.random() * 32; // Between 8 and 40
        trippyInterval = 1000 + Math.random() * 2000; // 1–3 seconds
        lastTrippyUpdate = now;
      }
    } else {
      currentPaddleHeight = paddleHeight;
    }
  
    // Update extra mini balls (for Trippy mode)
    updateExtraBalls();
  
    // Run movement logic only when not paused.
    moveSingle();
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

// Update extra mini balls: move and fade them out.
function updateExtraBalls() {
  for (let i = extraBalls.length - 1; i >= 0; i--) {
    let b = extraBalls[i];
    b.x += b.vx;
    b.y += b.vy;
    b.alpha -= 0.02; // Fade out
    if (b.alpha <= 0) {
      extraBalls.splice(i, 1);
    }
  }
}

// Single-ball movement logic.
function moveSingle() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  
  // Bounce off top/bottom
  if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
    ballSpeedY *= -1;
    ballSpeedX *= 1.1;
  }
  
  let playerPaddleSpeed = playerY - lastPlayerY;
  lastPlayerY = playerY;
  
  // Collision with player's paddle
  if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
    ballSpeedX = Math.abs(ballSpeedX);
    ballSpeedY += playerPaddleSpeed * 0.5;
    if (aiDifficulty === "UltraInsane") {
      ballSpeedX *= 1.2;
      ballSpeedY *= 1.2;
    } else if (aiDifficulty === "Insaniest") {
      ballSpeedX *= 1.3;
      ballSpeedY *= 1.3;
    }
  }
  
  // Collision with AI paddle
  if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
    ballSpeedX = -Math.abs(ballSpeedX);
    if (aiDifficulty === "UltraInsane") {
      ballSpeedX *= 1.2;
      ballSpeedY *= 1.2;
    } else if (aiDifficulty === "Insaniest") {
      ballSpeedX *= 1.3;
      ballSpeedY *= 1.3;
    }
  }
  
  // Scoring: if ball goes offscreen, pause the game and wait for spacebar to continue.
  if (ballX - ballRadius < 0) {
    aiScore++;
    if (aiScore === maxScore) endGame("lose");
    else pauseAfterPoint();
  } else if (ballX + ballRadius > canvas.width) {
    playerScore++;
    if (playerScore === maxScore) endGame("win");
    else pauseAfterPoint();
  }
  
  // AI paddle follows the ball.
  let aiReactionSpeed = difficulties[aiDifficulty].aiReaction;
  if (aiY + paddleHeight / 2 < ballY - 10) {
    aiY += playerSpeed * aiReactionSpeed;
  } else if (aiY + paddleHeight / 2 > ballY + 10) {
    aiY -= playerSpeed * aiReactionSpeed;
  }
  
  // Player paddle movement.
  if (moveUp && playerY > 0) playerY -= playerSpeed;
  if (moveDown && playerY < canvas.height - paddleHeight) playerY += playerSpeed;
  lastPlayerY = playerY;
}

// Draw function
function draw() {
  // Background: if Trippy mode, random rainbow; otherwise, semi-transparent black.
  if (aiDifficulty === "Trippy") {
    let hue = Math.floor(Math.random() * 360);
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!gameStarted) {
    // If the game is not started (or paused), show the appropriate overlay.
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    if (paused) {
      ctx.fillText("Press SPACEBAR to continue", canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillText("Press SPACEBAR to Start", canvas.width / 2, canvas.height / 2);
    }
    return;
  }
  
  // Draw paddles.
  let ph = (aiDifficulty === "Trippy" || aiDifficulty === "Insaniest") ? currentPaddleHeight : paddleHeight;
  ctx.fillStyle = "white";
  ctx.fillRect(10, playerY, paddleWidth, ph);
  ctx.fillRect(canvas.width - 20, aiY, paddleWidth, ph);
  
  // Draw the main ball.
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // In Trippy mode, draw extra mini balls.
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
  
  // Draw scores and mode label.
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Player: ${playerScore}`, 20, 30);
  ctx.textAlign = "right";
  ctx.fillText(`AI: ${aiScore}`, canvas.width - 20, 30);
  ctx.textAlign = "center";
  ctx.fillText(`Mode: ${aiDifficulty}`, canvas.width / 2, 30);
  
  // If game over, display a message.
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText(gameOver === "win" ? "🎉 YOU WIN! 🎉" : "😞 YOU LOSE! 😞", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("Press SPACEBAR to Restart", canvas.width / 2, canvas.height / 2 + 40);
  }
}

// Reset the ball (single-ball mode).
function resetBall() {
  ballRadius = 8;
  let speedMultiplier = difficulties[aiDifficulty].ballSpeedMultiplier;
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
  ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
}

// Pause the game after a point is scored.
function pauseAfterPoint() {
  paused = true;
  gameStarted = false;
}

// Change mode/difficulty and reset the game.
function setDifficulty(level) {
  if (difficulties[level]) {
    aiDifficulty = level;
    console.log("Mode set to: " + aiDifficulty);
    extraBalls = [];
    // For non-Infinite modes, scoring target remains 5.
    maxScore = 5;
    resetGame();
  } else {
    console.log("No mode for: " + level);
  }
}

// End game.
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
  paused = false;
  resetBall();
}

// Event handlers.
function handleKeydown(event) {
  console.log("Key pressed: " + event.key);
  // If spacebar is pressed and the game is paused, resume.
  if (event.key === " ") {
    if (paused) {
      paused = false;
      gameStarted = true;
      resetBall();
      return;
    }
    if (!gameStarted) {
      gameStarted = true;
      resetBall();
      gameLoop();
      return;
    }
    if (gameOver) {
      resetGame();
      return;
    }
  }
  if (event.key === "ArrowUp") moveUp = true;
  if (event.key === "ArrowDown") moveDown = true;
  if (event.key === "1") setDifficulty("Easy");
  if (event.key === "2") setDifficulty("Medium");
  if (event.key === "3") setDifficulty("Hard");
  if (event.key === "4") setDifficulty("Insane");
  if (event.key === "5") setDifficulty("UltraInsane");
  if (event.key === "6") {
    console.log("Setting mode to Insaniest");
    setDifficulty("Insaniest");
  }
  if (event.key === "7" || event.key === "Numpad7") {
    console.log("Setting mode to Big Ball");
    setDifficulty("BigBall");
  }
  if (event.key === "8" || event.key === "Numpad8") {
    console.log("Setting mode to Trippy");
    setDifficulty("Trippy");
  }
}

function handleKeyup(event) {
  if (event.key === "ArrowUp") moveUp = false;
  if (event.key === "ArrowDown") moveDown = false;
}

document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

// Draw the initial screen.
draw();
