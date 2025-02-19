// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const playerSpeed = 5; // Smooth player movement

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let baseBallSpeedX = 6.3, baseBallSpeedY = 6.3;
let ballSpeedX = baseBallSpeedX, ballSpeedY = baseBallSpeedY;
let ballRadius = 8;

// Score tracking
let playerScore = 0, aiScore = 0;
const maxScore = 5; // First to 5 wins

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
    move();
    draw();
    requestAnimationFrame(gameLoop);
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
}

// Move ball and paddles
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1;
    }

    // Ball collision with paddles
    if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
        ballSpeedX *= -1;
    }
    if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
        ballSpeedX *= -1;
    }

    // Ball out of bounds
    if (ballX < 0) {
        aiScore++;
        resetBall();
    } else if (ballX > canvas.width) {
        playerScore++;
        if (playerScore === maxScore) {
            saveToLeaderboard(playerScore, aiDifficulty);
        }
        resetBall();
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

// Save to leaderboard (Top 10 scores)
function saveToLeaderboard(score, difficulty) {
    let name = prompt("You won! Enter your name:");
    if (!name) return;

    leaderboard.push({ name, score, difficulty, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    updateLeaderboard();
}

// Update leaderboard display
function updateLeaderboard() {
    const leaderboardEl = document.getElementById("leaderboard");
    leaderboardEl.innerHTML = leaderboard.map(entry => 
        `<li>${entry.name} - ${entry.score} (${entry.difficulty})</li>`
    ).join("");
}

// Load leaderboard on page load
updateLeaderboard();

// Start game loop
gameLoop();
