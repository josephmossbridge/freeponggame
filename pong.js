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

// AI Difficulty Levels
const difficulties = {
    "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.72 },
    "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
    "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.17 },
    "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 },
    "UltraInsane": { aiReaction: 2.0, ballSpeedMultiplier: 3.0 } // Ultra ultra fast mode
};
let aiDifficulty = "Medium"; // Default difficulty

// Player movement tracking
let moveUp = false, moveDown = false;

// Game loop
function gameLoop() {
    if (!gameOver && gameStarted) {
        move();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If game hasn't started, show start message and exit draw
    if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press SPACEBAR to Start", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Draw paddles
    ctx.fillStyle = "white";
    ctx.fillRect(10, playerY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 20, aiY, paddleWidth, paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Player: ${playerScore}`, 20, 30);
    ctx.textAlign = "right";
    ctx.fillText(`AI: ${aiScore}`, canvas.width - 20, 30);

    // Draw difficulty setting
    ctx.textAlign = "center";
    ctx.fillText(`Difficulty: ${aiDifficulty}`, canvas.width / 2, 30);

    // If game over, display win/lose message
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

// Move ball and paddles
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom: reverse Y and add a slight horizontal boost
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1;
        ballSpeedX *= 1.1;
    }

    // Calculate player's paddle speed (to impact ball bounce)
    let playerPaddleSpeed = playerY - lastPlayerY;
    lastPlayerY = playerY;

    // Ball collision with player's paddle
    if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX); // Ensure ball goes right
        ballSpeedY += playerPaddleSpeed * 0.5; // Add paddle speed impact
        if (aiDifficulty === "UltraInsane") {
            ballSpeedX *= 1.2; // Extra boost in UltraInsane mode
            ballSpeedY *= 1.2;
        }
    }
    // Ball collision with AI paddle
    if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
        ballSpeedX = -Math.abs(ballSpeedX); // Ensure ball goes left
        if (aiDifficulty === "UltraInsane") {
            ballSpeedX *= 1.2;
            ballSpeedY *= 1.2;
        }
    }

    // Check for scoring (ball goes offscreen behind a paddle)
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
            saveToLeaderboard(playerScore, aiDifficulty); // Save score to Firebase
            endGame("win");
        } else {
            resetBall();
        }
    }

    // AI p
