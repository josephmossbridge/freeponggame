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

// Base ball properties (for single-ball modes)
const baseBallSpeedX = 6.3, baseBallSpeedY = 6.3;
let ballSpeedX = 0, ballSpeedY = 0;
let ballRadius = 8;

// Scoring & game state
let playerScore = 0, aiScore = 0;
let maxScore = 5; // Default target; in Infinite mode, this becomes 5000.
let gameOver = false;
let gameStarted = false;

// Variables for Trippy mode effects
let currentPaddleHeight = paddleHeight;
let lastTrippyUpdate = 0;
let trippyInterval = 0;
let extraBalls = [];

// For Infinite mode, use an array of balls.
let balls = [];

// AI Difficulty Levels & Modes
const difficulties = {
  "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.72 },
  "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
  "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.17 },
  "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 },
  "UltraInsane": { aiReaction: 2.0, ballSpeedMultiplier: 3.0 },
  "Insaniest": { aiReaction: 3.0, ballSpeedMultiplier: 4.5 },
  "BigBall": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
  "Trippy": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
  "Infinite": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 }
};
let aiDifficulty = "Medium"; // Default mode

// Player movement tracking
let moveUp = false, moveDown = false;

// Main game loop
function gameLoop() {
  // For Trippy mode, update paddle and ball size effects every 1–3 seconds.
  if (aiDifficulty === "Trippy") {
    const now = Date.now();
    if (!lastTrippyUpdate || now - lastTrippyUpdate >= trippyInterval) {
      currentPaddleHeight = 30 + Math.random() * 170; // Between 30 and 200
      ballRadius = 8 + Math.random() * 32; // Between 8 and 40
      trippyInterval = 1000 + Math.random() * 2000; // 1–3 seconds
      lastTrippyUpdate = now;
    }
  } else if (aiDifficulty !== "Trippy") {
    currentPaddleHeight = paddleHeight;
  }

  // Use different movement functions based on mode.
  if (aiDifficulty === "Infinite") {
    moveInfinite();
  } else {
    moveSingle();
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

// --- Infinite Mode Functions --- //
function moveInfinite() {
  let collisionsThisFrame = 0;
  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];
    b.x += b.vx;
    b.y += b.vy;
    // Bounce off top/bottom without extra speed multipliers.
    if (b.y - b.radius < 0) {
      b.y = b.radius;
      b.vy = -b.vy;
    }
    if (b.y + b.radius > canvas.height) {
      b.y = canvas.height - b.radius;
      b.vy = -b.vy;
    }
    // Collision with player's paddle.
    if (b.x - b.radius < 20 && b.y > playerY && b.y < playerY + paddleHeight) {
      b.x = 20 + b.radius;
      b.vx = Math.abs(b.vx);
      if (!b.justHit) {
        b.justHit = true;
        collisionsThisFrame++;
      }
    }
    // Collision with AI paddle.
    if (b.x + b.radius > canvas.width - 20 && b.y > aiY && b.y < aiY + paddleHeight) {
      b.x = canvas.width - 20 - b.radius;
      b.vx = -Math.abs(b.vx);
      if (!b.justHit) {
        b.justHit = true;
        collisionsThisFrame++;
      }
    }
    // Reset justHit if not colliding with a paddle.
    if (!((b.x - b.radius < 20 && b.y > playerY && b.y < playerY + paddleHeight) ||
          (b.x + b.radius > canvas.width - 20 && b.y > aiY && b.y < aiY + paddleHeight))) {
      b.justHit = false;
    }
    // Scoring: if ball goes offscreen, remove it and update score.
    if (b.x - b.radius < 0) {
      aiScore++;
      balls.splice(i, 1);
    } else if (b.x + b.radius > canvas.width) {
      playerScore++;
      balls.splice(i, 1);
    }
  }
  // For each collision event, duplicate all remaining balls.
  if (collisionsThisFrame > 0 && balls.length > 0) {
    let copy = balls.map(b => ({ ...b, justHit: false }));
    balls = balls.concat(copy);
  }
  // If all balls are lost, spawn a new ball.
  if (balls.length === 0) {
    balls.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * difficulties["Infinite"].ballSpeedMultiplier,
      vy: (Math.random() * 6 - 3) * difficulties["Infinite"].ballSpeedMultiplier,
      radius: 8,
      justHit: false
    });
  }
  // AI paddle follows one of the balls (choose the one with the highest x value).
  if (balls.length > 0) {
    let target = balls.reduce((prev, curr) => (curr.x > prev.x ? curr : prev), balls[0]);
    if (aiY + paddleHeight / 2 < target.y - 10) {
      aiY += playerSpeed * difficulties["Infinite"].aiReaction;
    } else if (aiY + paddleHeight / 2 > target.y + 10) {
      aiY -= playerSpeed * difficulties["Infinite"].aiReaction;
    }
  }
  // Player paddle movement.
  if (moveUp && playerY > 0) playerY -= playerSpeed;
  if (moveDown && playerY < canvas.height - paddleHeight) playerY += playerSpeed;
  lastPlayerY = playerY;
}

// --- Single-Ball Mode --- //
function moveSingle() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
    ballSpeedY *= -1;
    ballSpeedX *= 1.1;
  }
  let playerPaddleSpeed = playerY - lastPlayerY;
  lastPlayerY = playerY;
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
  if (ballX - ballRadius < 0) {
    aiScore++;
    if (aiScore === maxScore) endGame("lose");
    else resetBall();
  } else if (ballX + ballRadius > canvas.width) {
    playerScore++;
    if (playerScore === maxScore) endGame("win");
    else resetBall();
  }
  let aiReactionSpeed = difficulties[aiDifficulty].aiReaction;
  if (aiY + paddleHeight / 2 < ballY - 10) aiY += playerSpeed * aiReactionSpeed;
  else if (aiY + paddleHeight / 2 > ballY + 10) aiY -= playerSpeed * aiReactionSpeed;
  if (moveUp && playerY > 0) playerY -= playerSpeed;
  if (moveDown && playerY < canvas.height - paddleHeight) playerY += playerSpeed;
  lastPlayerY = playerY;
}

// Draw function
function draw() {
  // Background: for Trippy mode, use a random rainbow color; otherwise, semi-transparent black.
  if (aiDifficulty === "Trippy") {
    let hue = Math.floor(Math.random() * 360);
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACEBAR to Start", canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw paddles – if in Trippy (or Insaniest) mode, use currentPaddleHeight.
  let ph = (aiDifficulty === "Trippy" || aiDifficulty === "Insaniest") ? currentPaddleHeight : paddleHeight;
  ctx.fillStyle = "white";
  ctx.fillRect(10, playerY, paddleWidth, ph);
  ctx.fillRect(canvas.width - 20, aiY, paddleWidth, ph);

  // Draw ball(s)
  if (aiDifficulty === "Infinite") {
    for (let b of balls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

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

  // Game over message.
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

// Reset function
function resetBall() {
  if (aiDifficulty === "Infinite") {
    maxScore = 5000;
    balls = [];
    balls.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * difficulties["Infinite"].ballSpeedMultiplier,
      vy: (Math.random() * 6 - 3) * difficulties["Infinite"].ballSpeedMultiplier,
      radius: 8,
      justHit: false
    });
  } else {
    ballRadius = 8;
    let speedMultiplier = difficulties[aiDifficulty].ballSpeedMultiplier;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
    ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
  }
}

// Change mode/difficulty and reset game.
function setDifficulty(level) {
  if (difficulties[level]) {
    aiDifficulty = level;
    console.log("Mode set to: " + aiDifficulty);
    extraBalls = [];
    if (aiDifficulty === "Infinite") {
      maxScore = 5000;
    } else {
      maxScore = 5;
    }
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
  resetBall();
}

// Handle key events.
function handleKeydown(event) {
  console.log("Key pressed: " + event.key);
  if (event.key === "ArrowUp") moveUp = true;
  if (event.key === "ArrowDown") moveDown = true;
  if (event.key === " " && !gameStarted) {
    gameStarted = true;
    resetBall();
    gameLoop();
  }
  if (event.key === " " && gameOver) resetGame();
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
  if (event.key === "9" || event.key === "Numpad9") {
    console.log("Setting mode to Infinite Pong");
    setDifficulty("Infinite");
  }
}

function handleKeyup(event) {
  if (event.key === "ArrowUp") moveUp = false;
  if (event.key === "ArrowDown") moveDown = false;
}

document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

draw();
