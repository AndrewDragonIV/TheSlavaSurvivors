import { Particle, Weapon, Player, Enemy, createExplosion, generateRandomWeapon } from './game.js';

// Глобальные переменные
const particles = [];
const enemies = [];
const weaponsOnGround = [];
const player = new Player('Slavik');

// Инициализация игрового поля
const gameContainer = document.getElementById('game-container');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
gameContainer.appendChild(canvas);

// Загрузка изображений
const backgroundImage = new Image();
backgroundImage.src = '../assets/background.png';

const playerImage = new Image();
playerImage.src = '../assets/slavik.png';

// Система очков
const scores = [];

function updateScores(playerName, score) {
    scores.push({ name: playerName, score: score });
    scores.sort((a, b) => b.score - a.score);
}

function displayScores() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Таблица Рейтинга:', 10, 30);
    scores.forEach((entry, index) => {
        ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, 10, 60 + index * 30);
    });
}

// Создание врагов
function spawnEnemy() {
    let x, y;
    const minDistance = 200; // Минимальное расстояние от игрока
    
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        const distance = Math.sqrt(
            Math.pow(x - player.position.x, 2) + 
            Math.pow(y - player.position.y, 2)
        );
        if (distance >= minDistance) break;
    } while (true);

    const enemy = new Enemy('basic');
    enemy.position.x = x;
    enemy.position.y = y;
    enemies.push(enemy);
}

// Создание оружия
function spawnWeapon() {
    const weapon = generateRandomWeapon();
    weapon.position = {
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 30)
    };
    weaponsOnGround.push(weapon);
}

// Показать экран окончания игры
function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Финальный счет: ${player.score}`, canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#4CAF50';
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 50;
    
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Начать заново', canvas.width / 2, buttonY + 30);
    
    canvas.addEventListener('click', handleRestartClick);
    canvas.addEventListener('touchstart', handleRestartClick);
}

// Обработчик клика для кнопки рестарта
function handleRestartClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.type === 'click' ? event.clientX - rect.left : event.touches[0].clientX - rect.left;
    const y = event.type === 'click' ? event.clientY - rect.top : event.touches[0].clientY - rect.top;
    
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 50;
    
    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
        restartGame();
    }
}

// Функция рестарта игры
function restartGame() {
    canvas.removeEventListener('click', handleRestartClick);
    canvas.removeEventListener('touchstart', handleRestartClick);
    
    player.health = player.maxHealth;
    player.score = 0;
    player.isAlive = true;
    player.weapon = null;
    player.position = { x: 400, y: 300 };
    
    enemies.length = 0;
    weaponsOnGround.length = 0;
    particles.length = 0;
    
    for (let i = 0; i < 5; i++) {
        spawnEnemy();
    }
}

// Функция отрисовки
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка фона
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Отрисовка оружия на земле
    weaponsOnGround.forEach(weapon => {
        ctx.fillStyle = weapon.color;
        ctx.fillRect(weapon.position.x, weapon.position.y, 20, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, weapon.position.x + 10, weapon.position.y - 5);
    });

    // Отрисовка частиц
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].lifetime <= 0) {
            particles.splice(i, 1);
        }
    }

    // Отрисовка врагов
    enemies.forEach(enemy => {
        // Эффект вспышки при получении урона
        if (enemy.flashTime && Date.now() - enemy.flashTime < 100) {
            ctx.fillStyle = 'white';
        } else {
            ctx.fillStyle = 'red';
        }
        
        ctx.fillRect(enemy.position.x, enemy.position.y, 30, 30);

        // Полоска здоровья врага
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = 'darkred';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'lime';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth * healthPercentage, healthBarHeight);
    });

    if (player.isAlive) {
        // Эффект вспышки при получении урона
        if (player.flashTime && Date.now() - player.flashTime < 100) {
            ctx.globalAlpha = 0.7;
        }

        // Отрисовка игрока
        if (playerImage.complete) {
            ctx.drawImage(playerImage, player.position.x, player.position.y, 50, 50);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(player.position.x, player.position.y, 50, 50);
        }

        ctx.globalAlpha = 1;

        // Полоска здоровья игрока
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthPercentage = player.health / player.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth * healthPercentage, healthBarHeight);

        // Отображение текущего оружия
        if (player.weapon) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Оружие: ${player.weapon.name}`, player.position.x + 25, player.position.y - 15);
        }
    }

    // Отображение здоровья и счета
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Здоровье: ${player.health}/${player.maxHealth}`, 10, canvas.height - 30);
    ctx.fillText(`Счет: ${player.score}`, 10, canvas.height - 10);

    displayScores();
}

// Обработка касаний
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        return;
    }

    // Проверка подбора оружия
    for (let i = weaponsOnGround.length - 1; i >= 0; i--) {
        const weapon = weaponsOnGround[i];
        const distance = Math.sqrt(
            Math.pow(player.position.x - weapon.position.x, 2) +
            Math.pow(player.position.y - weapon.position.y, 2)
        );
        
        if (distance < 30) {
            player.equipWeapon(weapon);
            weaponsOnGround.splice(i, 1);
            break;
        }
    }

    // Атака
    player.attack(particles, enemies);
}, { passive: false });

document.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    player.move(x, y);
}, { passive: false });

// Предотвращение масштабирования страницы
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Начальная инициализация
for (let i = 0; i < 5; i++) {
    spawnEnemy();
}

// Респавн врагов
setInterval(() => {
    if (enemies.length < 10) {
        spawnEnemy();
    }
}, 5000);

// Спавн оружия
setInterval(spawnWeapon, 10000);

// Автоматическая атака
setInterval(() => {
    if (player.isAlive) {
        player.attack(particles, enemies);
    }
}, 1000);

// Игровой цикл
function gameLoop() {
    enemies.forEach(enemy => enemy.moveTowards(player));
    draw();
    requestAnimationFrame(gameLoop);
}

// Запуск игры
requestAnimationFrame(gameLoop);
