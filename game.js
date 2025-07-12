const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");



// Players are tracked via unique user IDs
// Score increases based on interactions, not performance outcome
// Recompenses are given when players reach engagement thresholds
// No win or lose condition — game focuses on participation and progress
// the game can take pauses, and players can return to continue from where they left off anytime

// --- New Features ---

// Simulate unique user ID (in real app, use auth/session)
const userId = localStorage.getItem("pongUserId") || (() => {
    const id = "user-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("pongUserId", id);
    return id;
})();

// Persistent player state
let playerState = JSON.parse(localStorage.getItem("pongState_" + userId)) || {
    score: 0,
    engagement: 0,
    recompenses: [],
    paused: false
};

// Engagement thresholds for recompenses
const thresholds = [5, 15, 30, 50];
const recompenseNames = ["Bronze", "Silver", "Gold", "Platinum"];

// Save state
function saveState() {
    localStorage.setItem("pongState_" + userId, JSON.stringify(playerState));
}

// Increase engagement on paddle hit
function onPaddleHit() {
    playerState.engagement++;
    playerState.score++; // Score = number of interactions
    // Check for recompense
    thresholds.forEach((t, i) => {
        if (playerState.engagement === t && !playerState.recompenses.includes(recompenseNames[i])) {
            playerState.recompenses.push(recompenseNames[i]);
            alert(`Bravo! Vous avez gagné la récompense ${recompenseNames[i]}!`);
        }
    });
    saveState();
}

// Pause/resume system
function pauseGame() {
    playerState.paused = true;
    saveState();
}

function resumeGame() {
    playerState.paused = false;
    saveState();
    gameLoop();
}

// UI: show score, engagement, recompenses
function drawHUD() {
    ctx.font = "18px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score: ${playerState.score}`, 20, 30);
    ctx.fillText(`Engagement: ${playerState.engagement}`, 20, 55);
    ctx.fillText(`Récompenses: ${playerState.recompenses.join(", ")}`, 20, 80);
    if (playerState.paused) {
        ctx.fillStyle = "#fff8";
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        ctx.fillStyle = "#222";
        ctx.font = "36px Arial";
        ctx.fillText("PAUSE", canvas.width / 2 - 60, canvas.height / 2 + 12);
    }
}

// Override draw to include HUD
const originalDraw = draw;
draw = function() {
    originalDraw();
    drawHUD();
};

// Override update to handle pause and engagement
const originalUpdate = update;
update = function() {
    if (playerState.paused) return;
    // Before ball moves, check for paddle hit
    const prevBallX = ball.x;
    originalUpdate();
    // If ball just bounced on a paddle, count as interaction
    if (
        (prevBallX < leftPaddle.x + leftPaddle.width && ball.x >= leftPaddle.x + leftPaddle.width) ||
        (prevBallX > rightPaddle.x && ball.x <= rightPaddle.x)
    ) {
        onPaddleHit();
    }
};

// Keyboard controls for pause/resume
document.addEventListener("keydown", (e) => {
    if (e.key === "p") {
        if (!playerState.paused) pauseGame();
        else resumeGame();
    }
});

// On load, resume if not paused
if (!playerState.paused) {
    gameLoop();
} else {
    draw();
}


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

// --- Ajouts Modernes ---

// Système d’XP et de niveaux
let xp = Number(localStorage.getItem("pongXP_" + userId)) || 0;
let level = Number(localStorage.getItem("pongLevel_" + userId)) || 1;
function gainXP(amount) {
    xp += amount;
    localStorage.setItem("pongXP_" + userId, xp);
    if (xp >= level * 10) {
        level++;
        localStorage.setItem("pongLevel_" + userId, level);
        showLevelUp();
    }
    updateHUD();
}
function showLevelUp() {
    const notif = document.createElement("div");
    notif.textContent = `Niveau ${level} atteint !`;
    notif.style.position = "absolute";
    notif.style.top = "40%";
    notif.style.left = "50%";
    notif.style.transform = "translate(-50%, -50%)";
    notif.style.background = "#222";
    notif.style.color = "#fff";
    notif.style.padding = "24px";
    notif.style.borderRadius = "12px";
    notif.style.fontSize = "2em";
    notif.style.zIndex = 100;
    document.body.appendChild(notif);
    setTimeout(() => document.body.removeChild(notif), 1200);
}

// HUD XP/Niveau
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "20px";
hud.style.left = "50%";
hud.style.transform = "translateX(-50%)";
hud.style.background = "#222c";
hud.style.color = "#fff";
hud.style.padding = "8px 24px";
hud.style.borderRadius = "8px";
hud.style.fontFamily = "sans-serif";
hud.style.fontSize = "1.2em";
hud.style.zIndex = 10;
document.body.appendChild(hud);
function updateHUD() {
    hud.textContent = `XP: ${xp} | Niveau: ${level}`;
}
updateHUD();

// Changement de skin de raquette
const paddleColors = ["#4af", "#f44", "#2ecc40", "#ffdc00", "#b10dc9"];
let currentPaddleColor = 0;
const skinBtn = document.createElement("button");
skinBtn.textContent = "Changer Skin";
skinBtn.style.position = "absolute";
skinBtn.style.top = "60px";
skinBtn.style.right = "30px";
skinBtn.style.zIndex = 10;
skinBtn.style.padding = "8px 16px";
skinBtn.style.borderRadius = "8px";
skinBtn.style.border = "none";
skinBtn.style.background = "#333";
skinBtn.style.color = "#fff";
skinBtn.style.cursor = "pointer";
skinBtn.onclick = () => {
    currentPaddleColor = (currentPaddleColor + 1) % paddleColors.length;
    leftPaddle.color = paddleColors[currentPaddleColor];
};
document.body.appendChild(skinBtn);

// Pause / Reprise avec bouton
let paused = false;
const pauseBtn = document.createElement("button");
pauseBtn.textContent = "Pause";
pauseBtn.style.position = "absolute";
pauseBtn.style.top = "100px";
pauseBtn.style.right = "30px";
pauseBtn.style.zIndex = 10;
pauseBtn.style.padding = "8px 16px";
pauseBtn.style.borderRadius = "8px";
pauseBtn.style.border = "none";
pauseBtn.style.background = "#333";
pauseBtn.style.color = "#fff";
pauseBtn.style.cursor = "pointer";
pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Reprendre" : "Pause";
};
document.body.appendChild(pauseBtn);

// Ajoute l’XP sur chaque rebond joueur
const oldCollision = collision;
collision = function(paddle, ball) {
    const hit = oldCollision(paddle, ball);
    if (hit && paddle === leftPaddle) {
        gainXP(1);
    }
    return hit;
};

// Boucle de jeu modifiée pour pause
const oldGameLoop = gameLoop;
gameLoop = function() {
    if (!paused) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
};

// Start game
gameLoop();