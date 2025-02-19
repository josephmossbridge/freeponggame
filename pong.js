// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const paddleSpeed = 8; // Increased speed

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 4, ballSpeedY = 4, ballRadius = 8;

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
}

// Move ball and paddles
function move() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top/bottom
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY *= -1; // Reverse Y direction
    }

    // Ball collision with paddles
    if (
        (ballX - ballRadius < 20 && ballY > playerY && ballY < playerY + paddleHeight) ||
        (ballX + ballRadius > canvas.width - 20 && ballY > aiY && ballY < aiY + paddleHeight)
    ) {
        ballSpeedX *= -1; // Reverse X direction
    }

    // Ball out of bounds (reset)
    if (ballX < 0 || ballX > canvas.width) {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX; // Reverse direction after reset
    }

    // AI follows ball with slight delay
    if (aiY + paddleHeight / 2 < ballY - 10) {
        aiY += paddleSpeed * 0.6; // Move slower for fairness
    } else if (aiY + paddleHeight / 2 > ballY + 10) {
        aiY -= paddleSpeed * 0.6;
    }

    // Player movement
    if (moveUp && playerY > 0) playerY -= paddleSpeed;
    if (moveDown && playerY < canvas.height - paddleHeight) playerY += paddleSpeed;
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

// Start game loop
gameLoop();
