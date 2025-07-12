const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// Game objects
const paddleWidth = 12, paddleHeight = 100;
const ballRadius = 12;

// Left paddle (player)
const leftPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#4af",
    speed: 10
};

// Right paddle (AI)
const rightPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#f44",
    speed: 4
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    speed: 6,
    dx: 6 * (Math.random() > 0.5 ? 1 : -1),
    dy: 6 * (Math.random() * 2 - 1),
    color: "#fff"
};

// Draw rectangle (for paddle, etc.)
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Draw circle (for ball)
function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

// Draw net
function drawNet() {
    ctx.strokeStyle = "#fff8";
    ctx.lineWidth = 2;
    for (let y = 0; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 14);
        ctx.stroke();
    }
}

// Handle mouse movement for player paddle
canvas.addEventListener("mousemove", (evt) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = evt.clientY - rect.top;
    leftPaddle.y = mouseY - leftPaddle.height / 2;
    // Clamp paddle within canvas
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y + leftPaddle.height > canvas.height)
        leftPaddle.y = canvas.height - leftPaddle.height;
});

// Simple AI for right paddle
function moveAIPaddle() {
    // Move paddle center toward ball's y
    const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
    if (ball.y < paddleCenter - 12) {
        rightPaddle.y -= rightPaddle.speed;
    } else if (ball.y > paddleCenter + 12) {
        rightPaddle.y += rightPaddle.speed;
    }
    // Clamp
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    if (rightPaddle.y + rightPaddle.height > canvas.height)
        rightPaddle.y = canvas.height - rightPaddle.height;
}

// Collision detection
function collision(paddle, ball) {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height
    );
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    // Give a random direction
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * (Math.random() * 2 - 1);
}

// Draw everything
function draw() {
    // Clear
    drawRect(0, 0, canvas.width, canvas.height, "#222");
    drawNet();
    // Paddles
    drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, leftPaddle.color);
    drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, rightPaddle.color);
    // Ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

// Update positions
function update() {
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
    }

    // Left paddle collision
    if (collision(leftPaddle, ball)) {
        ball.dx = -ball.dx;
        // Add a bit of randomness to angle
        ball.dy += (Math.random() - 0.5) * 2;
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius; // Prevent sticking
    }

    // Right paddle collision
    if (collision(rightPaddle, ball)) {
        ball.dx = -ball.dx;
        ball.dy += (Math.random() - 0.5) * 2;
        ball.x = rightPaddle.x - ball.radius; // Prevent sticking
    }

    // Score (ball out of bounds)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        resetBall();
    }

    moveAIPaddle();
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();