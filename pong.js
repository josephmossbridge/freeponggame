// Select canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Paddle properties
const paddleWidth = 10, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let aiY = playerY;
const paddleSpeed = 5;

// Ball properties
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 4, ballSpeedY = 4, ballRadius = 8;

// Game loop
function gameLoop() {
    draw();  
    move();  
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
        ballSpeedY *= -1;
    }

    // AI follows ball (simple AI)
    if (aiY + paddleHeight / 2 < ballY) aiY += paddleSpeed;
    else if (aiY + paddleHeight / 2 > ballY) aiY -= paddleSpeed;
}

// Player movement
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && playerY > 0) playerY -= paddleSpeed;
    if (event.key === "ArrowDown" && playerY < canvas.height - paddleHeight) playerY += paddleSpeed;
});

// Start game loop
gameLoop();
