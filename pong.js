// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const paddleSpeed = 8;

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 4, ballSpeedY = 4, ballRadius = 8;

// Score tracking
let playerScore = 0;
let aiScore = 0;
const maxScore = 5; // First to 5 wins

// AI Difficulty Levels
const difficulties = {
    "Easy": 0.4,   // Slow reaction
    "Medium": 0.6, // Normal challenge
    "Hard": 0.8,   // Tough but beatable
    "Insane": 1.2  // Near perfect AI
};
let aiDifficulty = "Medium"; // Default difficulty

// Player movement tracking
let moveUp = false, moveDown = false;

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
    
    // Draw difficulty selection
    ctx.fillText(`Difficulty: ${aiDifficulty}`, canvas.width / 2 - 60, 30);
}

// Move ball and paddles
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1; // Reverse Y direction
    }

    // Ball collision with paddles (improved physics)
    if (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) {
        ballSpeedX *= -1;
        let hitPosition = (ballY - (playerY + paddleHeight / 2)) / (paddleHeight / 2);
        ballSpeedY = hitPosition * 5; // Adjust angle based on hit position
    }
    if (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight) {
        ballSpeedX *= -1;
        let hitPosition = (ballY - (aiY + paddleHeight / 2)) / (paddleHeight / 2);
        ballSpeedY = hitPosition * 5;
    }

    // Ball out of bounds (reset round)
    if (ballX < 0) {
        aiScore++;
        resetBall();
    } else if (ballX > canvas.width) {
        playerScore++;
        resetBall();
    }

    // AI follows ball based on difficulty
    let aiReactionSpeed = difficulties[aiDifficulty]; // Use selected difficulty
    if (aiY + paddleHeight / 2 < ballY - 10) aiY += paddleSpeed * aiReactionSpeed;
    else if (aiY + paddleHeight / 2 > ballY + 10) aiY -= paddleSpeed * aiReactionSpeed;

    // Player movement
    if (moveUp && playerY > 0) playerY -= paddleSpeed;
    if (moveDown && playerY < canvas.height - paddleHeight) playerY += paddleSpeed;
}

// Reset ball after a point
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = Math.random() > 0.5 ? 4 : -4;
    ballSpeedY = Math.random() * 4 - 2;
}

// Change AI difficulty
function changeDifficulty(level) {
    if (difficulties[level]) {
        aiDifficulty = level;
        resetBall(); // Reset game when changing difficulty
    }
}

// Listen for key presses
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") moveUp = true;
    if (event.key === "ArrowDown") moveDown = true;
});
document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp") moveUp = false;
    if (event.key === "ArrowDown") moveDown = false;
});

// Listen for difficulty selection (1-4)
document.addEventListener("keydown", (event) => {
    if (event.key === "1") changeDifficulty("Easy");
    if (event.key === "2") changeDifficulty("Medium");
    if (event.key === "3") changeDifficulty("Hard");
    if (event.key === "4") changeDifficulty("Insane");
});

// Start game loop
gameLoop();
