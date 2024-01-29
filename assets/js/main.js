// ./assets/js/main.js

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const colors = {
        grass: getComputedStyle(document.documentElement).getPropertyValue(
            "--grass-color"
        ),
        wall: getComputedStyle(document.documentElement).getPropertyValue(
            "--wall-color"
        ),
        treasure: getComputedStyle(document.documentElement).getPropertyValue(
            "--treasure-color"
        ),
        player: getComputedStyle(document.documentElement).getPropertyValue(
            "--player-color"
        ),
        playerDead: getComputedStyle(document.documentElement).getPropertyValue(
            "--player-dead-color"
        ),
        enemy: getComputedStyle(document.documentElement).getPropertyValue(
            "--enemy-color"
        ),
    };

    const gridSize = 40;
    const rows = 15;
    const cols = rows;
    const numTreasures = 3;
    const numWalls = 10;
    const lives = 3;

    let player = { x: 0, y: 0, lives: 3, score: 0 };
    let enemy = { x: cols - 1, y: rows - 1 };
    let treasures = [];
    let grid = [];
    let gameInterval;
    let gameStarted = false;

    function initializeGame() {
        canvas.width = cols * gridSize;
        canvas.height = rows * gridSize;

        gameStarted = true;
        grid = Array.from({ length: rows }, () => Array(cols).fill(colors.grass));

        for (let i = 0; i < numWalls; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * rows);
                col = Math.floor(Math.random() * cols);
            } while (
                grid[row][col] !== colors.grass ||
        (row === player.y && col === player.x) ||
        (row === enemy.y && col === enemy.x)
            );

            grid[row][col] = colors.wall;
        }

        treasures = [];
        for (let i = 0; i < numTreasures; i++) {
            let treasure;
            do {
                treasure = {
                    x: Math.floor(Math.random() * cols),
                    y: Math.floor(Math.random() * rows),
                };
            } while (
                grid[treasure.y][treasure.x] !== colors.grass ||
        (treasure.y === player.y && treasure.x === player.x) ||
        (treasure.y === enemy.y && treasure.x === enemy.x)
            );

            grid[treasure.y][treasure.x] = colors.treasure;
            treasures.push(treasure);
        }

        player = { x: 0, y: 0, lives: lives, score: 0 };
        enemy = { x: cols - 1, y: rows - 1 };

        drawGrid();

        const startButton = document.getElementById("startButton");
        if (startButton) {
            startButton.style.display = "none";
        }

        const gameCanvas = document.getElementById("gameCanvas");
        if (gameCanvas) {
            gameCanvas.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.3)";
        }

        const infoContainer = document.querySelector(".info-container");

        if (infoContainer) {
            infoContainer.style.display = "block";
        }

        const restartButton = document.getElementById("restartButton");
        if (restartButton) {
            restartButton.style.display = "block";
        }
    }

    function drawCharacter(character, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
            (character.x + 0.5) * gridSize,
            (character.y + 0.5) * gridSize,
            gridSize / 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
    }

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                ctx.fillStyle = grid[row][col];
                ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);

                if (
                    grid[row][col] === colors.player ||
          grid[row][col] === colors.playerDead
                ) {
                    drawCharacter(player, grid[row][col]);
                } else if (grid[row][col] === colors.enemy) {
                    drawCharacter(enemy, grid[row][col]);
                }
            }
        }
        drawCharacter(player, player.lives > 0 ? colors.player : colors.playerDead);
        drawCharacter(enemy, colors.enemy);

        updateScore();
        updateLives();
    }

    function movePlayer(direction) {
        if (!gameStarted || treasures.length === 0) return;

        const newX =
      player.x + (direction === "right" ? 1 : direction === "left" ? -1 : 0);
        const newY =
      player.y + (direction === "down" ? 1 : direction === "up" ? -1 : 0);

        if (
            newX < 0 ||
      newX >= cols ||
      newY < 0 ||
      newY >= rows ||
      grid[newY][newX] === colors.wall
        ) {
            return;
        }

        const treasureIndex = treasures.findIndex(
            (t) => t.x === newX && t.y === newY
        );

        if (treasureIndex !== -1) {
            player.score += 1;
            treasures.splice(treasureIndex, 1);
            grid[newY][newX] = colors.grass;

            if (treasures.length === 0) {
                showResultModal("Proficiat! U hebt alle schatten gevonden.", true);
                stopGame();
                return;
            }
        }

        player.x = newX;
        player.y = newY;

        if (player.x === enemy.x && player.y === enemy.y) {
            player.lives--;
            if (player.lives === 0) {
                showResultModal("Game over!", false);
                stopGame();
                return;
            }
        }

        drawGrid();
    }

    function moveEnemyTowardsPlayer() {
        if (!gameStarted || treasures.length === 0) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            const newEnemyX = enemy.x + (dx > 0 ? 1 : -1);

            if (isValidMove(newEnemyX, enemy.y)) {
                enemy.x = newEnemyX;
            }
        } else {
            const newEnemyY = enemy.y + (dy > 0 ? 1 : -1);

            if (isValidMove(enemy.x, newEnemyY)) {
                enemy.y = newEnemyY;
            }
        }

        if (player.x === enemy.x && player.y === enemy.y) {
            player.lives--;
            if (player.lives === 0) {
                showResultModal("Game over!", false);
                stopGame();
                return;
            }

            drawGrid();
        } else {
            drawGrid();
        }
    }

    function isValidMove(x, y) {
        if (x < 0 || x >= cols || y < 0 || y >= rows) {
            return false;
        }

        if (grid[y][x] === colors.wall) {
            return false;
        }

        const treasureIndex = treasures.findIndex((t) => t.x === x && t.y === y);
        if (treasureIndex !== -1) {
            if (x === player.x && y === player.y) {
                treasures.splice(treasureIndex, 1);
                grid[y][x] = colors.grass;
                player.score++;
                updateScore();

                if (treasures.length === 0) {
                    showResultModal("Proficiat! U hebt alle schatten gevonden.", true);
                    stopGame();
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        return true;
    }

    function showResultModal(message, playerWon) {
        const resultaatContainer = document.querySelector(".resultaat-container");
        const resultMessage = document.getElementById("resultaatBericht");
        const resultScore = document.getElementById("resultaatScore");
        const modalScore = document.getElementById("score");

        resultMessage.textContent = message;
        modalScore.textContent = player.score;

        if (playerWon) {
            resultScore.style.display = "block";
        }

        resultaatContainer.style.display = "flex";
    }

    function restartGame() {
        const resultaatContainer = document.querySelector(".resultaat-container");
        resultaatContainer.style.display = "none";

        initializeGame();
        gameInterval = setInterval(updateGame, 500);
    }

    function updateGame() {
        moveEnemyTowardsPlayer();
        drawGrid();
    }

    function updateScore() {
        document.getElementById("scoreInfo").innerText = "Score: " + player.score;
    }

    function updateLives() {
        document.getElementById("levens").innerText = "Levens: " + player.lives;
    }

    function stopGame() {
        clearInterval(gameInterval);
    }

    function startGame() {
        const startButton = document.getElementById("startButton");
        const restartButton = document.getElementById("restartButton");

        function handleKeyPress(event) {
            switch (event.key) {
            case "ArrowUp":
            case "w":
                movePlayer("up");
                break;
            case "ArrowDown":
            case "s":
                movePlayer("down");
                break;
            case "ArrowLeft":
            case "a":
                movePlayer("left");
                break;
            case "ArrowRight":
            case "d":
                movePlayer("right");
                break;
            case "Enter":
                if (!gameStarted && startButton) {
                    initializeGame();
                    gameInterval = setInterval(updateGame, 500);

                    if (startButton) {
                        startButton.style.display = "none";
                    }

                    if (restartButton) {
                        restartButton.style.display = "block";
                        restartButton.addEventListener("click", restartGame);
                    }

                    document.addEventListener("keydown", handleKeyPress);
                } else if (restartButton) {
                    restartGame();
                }
                break;
            }
        }

        if (startButton) {
            startButton.addEventListener("click", function () {
                initializeGame();
                gameInterval = setInterval(updateGame, 500);

                if (startButton) {
                    startButton.style.display = "none";
                }

                if (restartButton) {
                    restartButton.style.display = "block";
                    restartButton.addEventListener("click", restartGame);
                }

                document.addEventListener("keydown", handleKeyPress);
            });
        }

        document.addEventListener("keydown", handleKeyPress);
    }

    startGame();
});
