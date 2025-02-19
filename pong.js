// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const playerSpeed = 5; // Smooth player movement
let lastPlayerY = playerY; // Track previous Y position for physics

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let baseBallSpeedX = 6.3, baseBallSpeedY = 6.3;
let ballSpeedX = baseBallSpeedX, ballSpeedY = baseBallSpeedY;
let ballRadius = 8;

// Score tracking
let playerScore = 0, aiScore = 0;
const maxScore = 5; // First to 5 wins
let gameOver = false; // Track if game has ended

// AI Difficulty Levels
const difficulties = {
    "Easy": { aiReaction: 0.4, ballSpeedMultiplier: 0.72 },
    "Medium": { aiReaction: 0.6, ballSpeedMultiplier: 0.9 },
    "Hard": { aiReaction: 0.8, ballSpeedMultiplier: 1.17 },
    "Insane": { aiReaction: 1.2, ballSpeedMultiplier: 1.7 }
};
let aiDifficulty = "Medium"; // Default difficulty

// Player movement tracking
let moveUp = false, moveDown = false;

// Leaderboard (top 10 scores)
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

// Game loop
function gameLoop() {
    if (!gameOver) {
        move();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Draw game elements
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    ctx.fillText(`Player: ${playerScore}`, 20, 30);
    ctx.fillText(`AI: ${aiScore}`, canvas.width - 100, 30);

    // Draw difficulty setting
    ctx.fillText(`Difficulty: ${aiDifficulty}`, canvas.width / 2 - 60, 30);

    // Game Over Screen
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(gameOver === "win" ? "🎉 YOU WIN! 🎉" : "😞 YOU LOSE! 😞", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText("Press SPACEBAR to restart", canvas.width / 2, canvas.height / 2 + 40);
    }
}

// Move ball and paddles
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1;
    }

    // Ball collision with paddles + Paddle Speed Impact
    let playerPaddleSpeed = playerY - lastPlayerY;
    lastPlayerY = playerY;

    if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX); // Ensure ball moves right
        ballSpeedY += playerPaddleSpeed * 0.5; // Paddle movement influences ball angle
    }
    if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
        ballSpeedX = -Math.abs(ballSpeedX); // Ensure ball moves left
    }

    // Fix Ball Stuck Behind Paddle
    if (ballX - ballRadius < 0) ballX = ballRadius;
    if (ballX + ballRadius > canvas.width) ballX = canvas.width - ballRadius;

    // Ball out of bounds
    if (ballX < 0) {
        aiScore++;
        if (aiScore === maxScore) {
            endGame("lose");
        } else {
            resetBall();
        }
    } else if (ballX > canvas.width) {
        playerScore++;
        if (playerScore === maxScore) {
            endGame("win");
        } else {
            resetBall();
        }
    }

    // AI follows ball
    let aiReactionSpeed = difficulties[aiDifficulty].aiReaction;
    if (aiY + paddleHeight / 2 < ballY - 10) aiY += playerSpeed * aiReactionSpeed;
    else if (aiY + paddleHeight / 2 > ballY + 10) aiY -= playerSpeed * aiReactionSpeed;

    // Player movement
    if (moveUp && playerY > 0) playerY -= playerSpeed;
    if (moveDown && playerY < canvas.height - paddleHeight) playerY += playerSpeed;
}

// Reset ball
function resetBall() {
    let speedMultiplier = difficulties[aiDifficulty].ballSpeedMultiplier;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * baseBallSpeedX * speedMultiplier;
    ballSpeedY = (Math.random() * 6 - 3) * speedMultiplier;
}

// End game
function endGame(result) {
    gameOver = result;
    setTimeout(() => {
        draw();
    }, 200);
}

// Restart game
function restartGame() {
    playerScore = 0;
    aiScore = 0;
    gameOver = false;
    resetBall();
    gameLoop();
}

// Handle key events
function handleKeydown(event) {
    if (event.key === "ArrowUp") moveUp = true;
    if (event.key === "ArrowDown") moveDown = true;
    if (event.key === " ") restartGame();
    if (event.key === "1") setDifficulty("Easy");
    if (event.key === "2") setDifficulty("Medium");
    if (event.key === "3") setDifficulty("Hard");
    if (event.key === "4") setDifficulty("Insane");
}

function handleKeyup(event) {
    if (event.key === "ArrowUp") moveUp = false;
    if (event.key === "ArrowDown") moveDown = false;
}

// Change AI difficulty (and reset game)
function setDifficulty(level) {
    if (difficulties[level]) {
        aiDifficulty = level;
        restartGame();
    }
}

// Add key listeners
document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

// Load leaderboard on page load
updateLeaderboard();

// Start game loop
gameLoop();
