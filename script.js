// Game Elements
const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const timeElement = document.querySelector("#time");

// Game Settings
const BLOCK_SIZE = 50;
const cols = Math.floor(board.clientWidth / BLOCK_SIZE);
const rows = Math.floor(board.clientHeight / BLOCK_SIZE);

// Game State
let snake = [{ x: 1, y: 3 }];
let direction = "down";
let food = randomFood();
let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let time = { min: 0, sec: 0 };

let moveInterval = null;
let timerInterval = null;

// Pre-render all blocks once
const blocks = {};
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${r}-${c}`] = block;
  }
}

highScoreElement.textContent = highScore;

// Utility Functions
function randomFood() {
  return {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols),
  };
}

function updateTime() {
  time.sec++;
  if (time.sec === 60) {
    time.min++;
    time.sec = 0;
  }
  timeElement.textContent = `${String(time.min).padStart(2, "0")}-${String(
    time.sec
  ).padStart(2, "0")}`;
}

function clearSnake() {
  snake.forEach(({ x, y }) => {
    const block = blocks[`${x}-${y}`];
    block.classList.remove("fill", "snake-head");
  });
}

function drawSnake() {
  snake.forEach(({ x, y }, i) => {
    const block = blocks[`${x}-${y}`];
    block.classList.add(i === 0 ? "snake-head" : "fill");
  });
}

function moveSnake() {
  const head = { ...snake[0] };

  const moveMap = {
    up: () => (head.x -= 1),
    down: () => (head.x += 1),
    left: () => (head.y -= 1),
    right: () => (head.y += 1),
  };
  moveMap[direction]();

  // Wall collision
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols)
    return gameOver();

  // Self collision
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y))
    return gameOver();

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    blocks[`${food.x}-${food.y}`].classList.remove("food");
    food = randomFood();
    blocks[`${food.x}-${food.y}`].classList.add("food");
    score += 10;
    scoreElement.textContent = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreElement.textContent = highScore;
    }

    snake.unshift(head);
  } else {
    clearSnake();
    snake.unshift(head);
    snake.pop();
  }

  drawSnake();
}

// Core Game Logic
function render() {
  blocks[`${food.x}-${food.y}`].classList.add("food");
  moveSnake();
}

function startGame() {
  resetGameState();
  modal.style.display = "none";
  moveInterval = setInterval(render, 400);
  timerInterval = setInterval(updateTime, 1000);
}

function gameOver() {
  clearInterval(moveInterval);
  clearInterval(timerInterval);
  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

function resetGameState() {
  // Clear board visuals
  Object.values(blocks).forEach((block) =>
    block.classList.remove("fill", "food")
  );

  // Reset data
  snake = [{ x: 1, y: 3 }];
  direction = "down";
  food = randomFood();
  score = 0;
  time = { min: 0, sec: 0 };

  scoreElement.textContent = score;
  timeElement.textContent = "00-00";
  highScoreElement.textContent = highScore;
}

// Controls
window.addEventListener("keydown", (event) => {
  const newDir = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  }[event.key];

  // Prevent reverse direction (instant death)
  if (
    (newDir === "up" && direction !== "down") ||
    (newDir === "down" && direction !== "up") ||
    (newDir === "left" && direction !== "right") ||
    (newDir === "right" && direction !== "left")
  ) {
    direction = newDir;
  }
});

function startCountdown(callback) {
  let count = 3;
  const countdownText = document.createElement("div");
  countdownText.classList.add("countdown");
  board.appendChild(countdownText);

  const countdownInterval = setInterval(() => {
    countdownText.textContent = count > 0 ? count : "Go!";
    if (count === 0) {
      clearInterval(countdownInterval);
      setTimeout(() => {
        countdownText.remove();
        callback();
      }, 500);
    }
    count--;
  }, 800);
}

// Event Listeners
startButton.addEventListener("click", () => {
  modal.style.display = "none";
  startCountdown(startGame);
});
restartButton.addEventListener("click", startGame);
