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

// Play paused
let isPaused = false;

// Sound Effects
const eatSound = new Audio("./sounds/eating.mp3");
const gameOverSound = new Audio("./sounds/game-over.mp3");

// Game State
let snake = [{ x: 1, y: 3 }];
let direction = "down";
let food = randomFood();
let score = 0;
let speed = 400; //Speed
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
  // Define different food types
  const foodTypes = [
    { type: "normal", score: 10, image: "./foods/apple.png", chance: 0.7 },
    {
      type: "golden",
      score: 30,
      image: "./foods/golden-apple.png",
      chance: 0.2,
    },
    {
      type: "rotten",
      score: -10,
      image: "./foods/rotten.png",
      chance: 0.1,
    },
  ];

  // Randomly select based on probability
  const rand = Math.random();
  let cumulative = 0;
  let selected = foodTypes[0];
  for (const f of foodTypes) {
    cumulative += f.chance;
    if (rand < cumulative) {
      selected = f;
      break;
    }
  }

  return {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols),
    ...selected, // includes type, score, and image
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
  updateTimeDisplay(time.min, time.sec);
}

// Smooth animation for score and time updates
function animateUpdate(element) {
  element.classList.add("updated");
  setTimeout(() => element.classList.remove("updated"), 300);
}

function updateScore(newScore) {
  scoreElement.textContent = newScore;
  animateUpdate(scoreElement);
}

function updateTimeDisplay(min, sec) {
  timeElement.textContent = `${String(min).padStart(2, "0")}-${String(
    sec
  ).padStart(2, "0")}`;
  animateUpdate(timeElement);
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
    if (i === 0) {
      block.style.transform =
        direction === "up"
          ? "rotate(270deg)"
          : direction === "down"
          ? "rotate(90deg)"
          : direction === "left"
          ? "rotate(180deg)"
          : "rotate(0deg)";
    } else {
      block.style.transform = "none";
    }
  });
}

//Adjust Speed
function adjustSpeed() {
  const newSpeed = 400 - Math.floor(score / 50) * 20;
  if (newSpeed !== speed && newSpeed >= 150) {
    speed = newSpeed;
    clearInterval(moveInterval);
    moveInterval = setInterval(render, speed);
  }
}

function showLevelUp() {
  levelUpElement.textContent = `Level ${level}`;
  levelUpElement.classList.add("show");
  setTimeout(() => levelUpElement.classList.remove("show"), 1000);
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
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    gameOverSound.play();
    return gameOver();
  }

  // Self collision
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y))
    return gameOver();

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    eatSound.play();
    if (food.type === "rotten") {
      board.classList.add("shake");
      setTimeout(() => board.classList.remove("shake"), 200);
    }
    adjustSpeed();
    // Remove old food
    const foodBlock = blocks[`${food.x}-${food.y}`];
    foodBlock.classList.remove("food");
    foodBlock.style.backgroundImage = "";

    // Update score based on food type
    score += food.score;
    if (score < 0) score = 0;
    updateScore(score);

    // Spawn new food
    food = randomFood();
    const newFoodBlock = blocks[`${food.x}-${food.y}`];
    newFoodBlock.classList.add("food");
    newFoodBlock.style.backgroundImage = `url(${food.image})`;
    newFoodBlock.style.backgroundSize = "cover";
    newFoodBlock.style.backgroundPosition = "center";

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
  const foodBlock = blocks[`${food.x}-${food.y}`];
  foodBlock.classList.add("food");
  foodBlock.style.backgroundImage = `url(${food.image})`;
  foodBlock.style.backgroundSize = "cover";
  foodBlock.style.backgroundPosition = "center";
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
  speed = 400;

  // Clear board visuals COMPLETELY
  Object.values(blocks).forEach((block) => {
    block.classList.remove("fill", "food", "snake-head");
    block.style.backgroundImage = "";
    block.style.backgroundSize = "";
    block.style.backgroundPosition = "";
  });

  // Remove leftover shake effect
  board.classList.remove("shake");

  // Reset data
  snake = [{ x: 1, y: 3 }];
  direction = "down";
  food = randomFood();
  score = 0;
  time = { min: 0, sec: 0 };

  // Reset UI
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
// Restart Logic
restartButton.addEventListener("click", () => {
  modal.style.display = "none";
  startCountdown(startGame);
});

// Enter spacebar to paused the game!
window.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    isPaused = !isPaused;
    if (isPaused) {
      clearInterval(moveInterval);
      clearInterval(timerInterval);
    } else {
      moveInterval = setInterval(render, speed);
      timerInterval = setInterval(updateTime, 1000);
    }
  }
});
