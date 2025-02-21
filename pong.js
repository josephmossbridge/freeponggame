// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const playerSpeed = 5;
let lastPlayerY = playerY; // To track paddle movement speed

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
const baseBallSpeedX = 6.3, baseBallSpeedY = 6.3; // Fixed starting speeds
let ballSpeedX = 0, ballSpeedY = 0; // Ball stays still until game starts
let ballRadius = 8;

// Score tracking
let playerScore = 0, aiScore = 0;
const maxScore = 5;
let gameOver = false;
let gameStarted = false;

// Global variable for current paddle height (for trippy effects)
let currentPaddleHeight = paddleHeight;

// Variables for controlling trippy mode update frequency
let lastTrippyUpdate = 0;
let trippyInterval = 0; // will be set when first entering Trippy mode

// Array to store extra mini balls (for Trippy mode)
let extraBalls = [];

// AI Difficulty Levels and Modes
const difficulties = {
    "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.72 },
    "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
    "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.17 },
    "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 },
    "UltraInsane": { aiReaction: 2.0, ballSpeedMultiplier: 3.0 },
    "Insaniest": { aiReaction: 3.0, ballSpeedMultiplier: 4.5 },
    "BigBall": { aiReaction: 0.6, ballSpeedMultiplier: 1.0 },
    "Trippy": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 } // Equivalent to Medium speed
};
let aiDifficulty = "Medium"; // Default difficulty

// Player movement tracking
let moveUp = false, moveDown = false;

// Game loop
function gameLoop() {
    // For Trippy mode, update extra effects only every 1–3 seconds.
    if (aiDifficulty === "Trippy") {
        const now = Date.now();
        if (!lastTrippyUpdate || now - lastTrippyUpdate >= trippyInterval) {
            // Set extreme random paddle height between 30 and 200
            currentPaddleHeight = 30 + Math.random() * 170;
            // Set extreme random ball radius between 8 and 40
            ballRadius = 8 + Math.random() * 32;
            // Set next update interval between 1 and 3 seconds (in ms)
            trippyInterval = 1000 + Math.random() * 2000;
            lastTrippyUpdate = now;
        }
    } else if (aiDifficulty !== "Trippy") {
        currentPaddleHeight = paddleHeight;
    }

    // Update extra mini balls (for Trippy mode)
    updateExtraBalls();

    if (!gameOver && gameStarted) {
        move();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Update extra mini balls: move them and fade them out.
function updateExtraBalls() {
    for (let i = extraBalls.length - 1; i >= 0; i--) {
        let b = extraBalls[i];
        b.x += b.vx;
        b.y += b.vy;
        b.alpha -= 0.02; // fade out over time
        if (b.alpha <= 0) {
            extraBalls.splice(i, 1);
        }
    }
}

// Draw game elements.
function draw() {
    // Background: if Trippy mode, use a random rainbow color; otherwise, use semi-transparent black.
    if (aiDifficulty === "Trippy") {
        let hue = Math.floor(Math.random() * 360);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If game hasn't started, show start message.
    if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press SPACEBAR to Start", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Use currentPaddleHeight for drawing paddles (in Trippy mode, it changes; otherwise, fixed).
    let ph = (aiDifficulty === "Trippy" || aiDifficulty === "Insaniest") ? currentPaddleHeight : paddleHeight;
    ctx.fillStyle = "white";
    ctx.fillRect(10, playerY, paddleWidth, ph);
    ctx.fillRect(canvas.width - 20, aiY, paddleWidth, ph);

    // Draw main ball.
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw extra mini balls (only in Trippy mode).
    if (aiDifficulty === "Trippy") {
        extraBalls.forEach(b => {
            ctx.fillStyle = `rgba(255,255,255,${b.alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        // Also, spawn extra mini balls with a small probability.
        if (Math.random() < 0.1) {
            extraBalls.push({
                x: ballX,
                y: ballY,
                radius: 3 + Math.random() * 5, // radius between 3 and 8
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1.0
            });
        }
    }

    // Draw scores and difficulty setting.
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Player: ${playerScore}`, 20, 30);
    ctx.textAlign = "right";
    ctx.fillText(`AI: ${aiScore}`, canvas.width - 20, 30);
    ctx.textAlign = "center";
    ctx.fillText(`Difficulty: ${aiDifficulty}`, canvas.width / 2, 30);

    // If game over, display win/lose message.
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

// Move ball and paddles.
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom: reverse Y and add a slight horizontal boost.
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1;
        ballSpeedX *= 1.1;
    }

    // Use current paddle height for collision if in Trippy or Insaniest mode.
    let ph = (aiDifficulty === "Trippy" || aiDifficulty === "Insaniest") ? currentPaddleHeight : paddleHeight;

    // Ball collision with player's paddle.
    if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + ph) {
        ballSpeedX = Math.abs(ballSpeedX); // Ensure ball goes right.
        let playerPaddleSpeed = playerY - lastPlayerY;
        ballSpeedY += playerPaddleSpeed * 0.5;
        if (aiDifficulty === "UltraInsane") {
            ballSpeedX *= 1.2;
            ballSpeedY *= 1.2;
        } else if (aiDifficulty === "Insaniest") {
            ballSpeedX *= 1.3;
            ballSpeedY *= 1.3;
        }
    }
    // Ball collision with AI paddle.
    if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + ph) {
        ballSpeedX = -Math.abs(ballSpeedX); // Ensure ball goes left.
        if (aiDifficulty === "UltraInsane") {
            ballSpeedX *= 1.2;
            ballSpeedY *= 1.2;
        } else if (aiDifficulty === "Insaniest") {
            ballSpeedX *= 1.3;
            ballSpeedY *= 1.3;
        }
    }

    // Check for scoring.
    if (ballX - ballRadius < 0) {
        aiScore++;
        if (aiScore === maxScore) {
            endGame("lose");
        } else {
            resetBall();
        }
    } else if (ballX + ballRadius > canvas.width) {
        playerScore++;
        if (playerScore === maxScore) {
            endGame("win");
        } else {
            resetBall();
        }
    }

    // AI paddle follows the ball.
    let aiReactionSpeed = difficulties[aiDifficulty].aiReaction;
    if (aiY + ph / 2 < ballY - 10) {
        aiY += playerSpeed * aiReactionSpeed;
    } else if (aiY + ph / 2 > ballY + 10) {
        aiY -= playerSpeed * aiReactionSpeed;
    }

    // Player paddle movement.
    if (moveUp && playerY > 0) {
        playerY -= playerSpeed;
    }
    if (moveDown && playerY < canvas.height - ph) {
        playerY += playerSpeed;
    }

    lastPlayerY = playerY;
}

// Reset the ball to the center with fixed base speeds.
// In "BigBall" mode, the ball's radius is set to 40.
function resetBall() {
    if (aiDifficulty === "BigBall") {
        ballRadius = 40;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX;
        ballSpeedY = (Math.random() * 6 - 3);
    } else {
        ballRadius = 8;
        let speedMultiplier = difficulties[aiDifficulty].ballSpeedMultiplier;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
        ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
    }
}

// Change difficulty (or mode) and reset the game.
function setDifficulty(level) {
    if (difficulties[level]) {
        aiDifficulty = level;
        console.log("Difficulty set to: " + aiDifficulty);
        // Clear extra mini balls when switching modes.
        extraBalls = [];
        resetGame();
    } else {
        console.log("No difficulty level for: " + level);
    }
}

// End the game.
function endGame(result) {
    gameOver = result;
    ballSpeedX = 0;
    ballSpeedY = 0;
}

// Reset game state for a new game.
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
        console.log("Setting difficulty to Insaniest");
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

// Add key listeners.
document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

// Draw the initial start screen.
draw();
