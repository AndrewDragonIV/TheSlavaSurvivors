// Класс врага
class Enemy {
    constructor(type) {
        this.type = type;
        this.health = 100;
        this.maxHealth = 100;
        this.position = {
            x: Math.random() * 800,
            y: Math.random() * 600
        };
        this.speed = 2;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 секунда между атаками
        this.isAlive = true;
    }

    takeDamage(damage) {
        if (!this.isAlive) return;
        this.health = Math.max(0, this.health - damage);
        
        // Добавляем эффект вспышки при получении урона
        this.flashTime = Date.now();
        
        if (this.health <= 0) {
            this.isAlive = false;
            player.score += 10; // Добавляем очки за убийство врага
            console.log(`Враг уничтожен! +10 очков`);
            
            // Создаем эффект взрыва
            createExplosion(this.position.x + 15, this.position.y + 15);
            
            // Удаляем врага из массива
            const index = enemies.indexOf(this);
            if (index > -1) {
                enemies.splice(index, 1);
            }
        }
    }

    moveTowards(target) {
        if (!this.isAlive || !target.isAlive) return;
        
        const dx = target.position.x - this.position.x;
        const dy = target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.position.x += (dx / distance) * this.speed;
            this.position.y += (dy / distance) * this.speed;
        }

        // Атака, если враг достаточно близко
        if (distance < 50) {
            this.attack(target);
        }
    }

    attack(target) {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            target.takeDamage(10);
            this.lastAttackTime = currentTime;
        }
    }
}

// Класс оружия
class Weapon {
    constructor(name, damage) {
        this.name = name;
        this.damage = damage;
    }
}

// Класс игрока
class Player {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.position = { x: 400, y: 300 }; // Начальная позиция в центре
        this.weapon = null;
        this.score = 0;
        this.isAlive = true;
    }

    move(x, y) {
        if (!this.isAlive) return;
        // Ограничиваем движение в пределах canvas
        this.position.x = Math.max(0, Math.min(750, x));
        this.position.y = Math.max(0, Math.min(550, y));
    }

    equipWeapon(weapon) {
        if (!this.isAlive) return;
        this.weapon = weapon;
    }

    attack() {
        if (!this.isAlive) return 0;
        if (this.weapon) {
            console.log(`${this.name} атакует с ${this.weapon.name} на ${this.weapon.damage} урона!`);
            // Атакуем всех врагов в радиусе
            enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(this.position.x - enemy.position.x, 2) +
                    Math.pow(this.position.y - enemy.position.y, 2)
                );
                if (distance < 100) { // Радиус атаки
                    enemy.takeDamage(this.weapon.damage);
                }
            });
            return this.weapon.damage;
        } else {
            console.log(`${this.name} атакует без оружия!`);
            // Атакуем ближайшего врага
            let nearestEnemy = null;
            let minDistance = Infinity;
            enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(this.position.x - enemy.position.x, 2) +
                    Math.pow(this.position.y - enemy.position.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            if (nearestEnemy && minDistance < 50) {
                nearestEnemy.takeDamage(10);
            }
            return 10; // Базовый урон без оружия
        }
    }

    takeDamage(damage) {
        if (!this.isAlive) return;
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.isAlive = false;
            console.log(`${this.name} погиб!`);
            updateScores(this.name, this.score);
            showGameOver();
        }
    }

    heal(amount) {
        if (!this.isAlive) return;
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

// Инициализация игрока и массива врагов
const player = new Player('Slavik');
const enemies = [];

// Создание врагов на безопасном расстоянии от игрока
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

// Начальное создание врагов
for (let i = 0; i < 5; i++) {
    spawnEnemy();
}

// Респавн врагов каждые 5 секунд, если их меньше 10
setInterval(() => {
    if (enemies.length < 10) {
        spawnEnemy();
        console.log('Появился новый враг!');
    }
}, 5000);

// Массив для хранения оружия на карте
const weaponsOnGround = [];

// Генерация случайного оружия
function generateRandomWeapon() {
    const weapons = [
        new Weapon('Меч', 25),
        new Weapon('Лук', 15),
        new Weapon('Дробовик', 40)
    ];
    return weapons[Math.floor(Math.random() * weapons.length)];
}

// Создание оружия на случайной позиции на карте
function spawnWeapon() {
    const weapon = generateRandomWeapon();
    weapon.position = {
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 30)
    };
    weaponsOnGround.push(weapon);
    console.log(`На карте появилось оружие: ${weapon.name}`);
}

// Обработка касаний для подбора оружия и атаки
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        return;
    }

    // Проверяем каждое оружие на земле
    for (let i = weaponsOnGround.length - 1; i >= 0; i--) {
        const weapon = weaponsOnGround[i];
        const distance = Math.sqrt(
            Math.pow(player.position.x - weapon.position.x, 2) +
            Math.pow(player.position.y - weapon.position.y, 2)
        );
        
        // Если игрок достаточно близко к оружию
        if (distance < 30) {
            player.equipWeapon(weapon);
            weaponsOnGround.splice(i, 1); // Удаляем подобранное оружие
            console.log(`${player.name} подобрал ${weapon.name} с ${weapon.damage} урона!`);
            break;
        }
    }

    // Атакуем при каждом касании
    player.attack();
}, { passive: false });

// Добавляем автоматическую атаку каждую секунду
setInterval(() => {
    if (player.isAlive) {
        player.attack();
    }
}, 1000);

// Спавн нового оружия каждые 10 секунд
setInterval(spawnWeapon, 10000);

// Обработка касаний для мобильных устройств
document.addEventListener('touchmove', (event) => {
    event.preventDefault(); // Предотвращаем скролл страницы
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Перемещение игрока к позиции касания
    player.move(x, y);
});

// Предотвращаем масштабирование страницы при двойном касании
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Инициализация игрового поля
const gameContainer = document.getElementById('game-container');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
gameContainer.appendChild(canvas);

// Загрузка изображений
const backgroundImage = new Image();
backgroundImage.src = './assets/background.png';

const playerImage = new Image();
playerImage.src = './assets/slavik.png';

const faviconImage = new Image();
faviconImage.src = './assets/favicon.ico';

// Система очков
const scores = [];

function updateScores(playerName, score) {
    scores.push({ name: playerName, score: score });
    scores.sort((a, b) => b.score - a.score);
}

function displayScores() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Таблица Рейтинга:', 10, 30);
    scores.forEach((entry, index) => {
        ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, 10, 60 + index * 30);
    });
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
    
    // Добавляем обработчик клика для кнопки рестарта
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
    // Удаляем обработчики событий рестарта
    canvas.removeEventListener('click', handleRestartClick);
    canvas.removeEventListener('touchstart', handleRestartClick);
    
    // Сбрасываем состояние игрока
    player.health = player.maxHealth;
    player.score = 0;
    player.isAlive = true;
    player.weapon = null;
    player.position = { x: 400, y: 300 };
    
    // Очищаем массивы врагов и оружия
    enemies.length = 0;
    weaponsOnGround.length = 0;
    
    // Создаем начальных врагов
    for (let i = 0; i < 5; i++) {
        spawnEnemy();
    }
}

// Система частиц для эффектов
const particles = [];

class Particle {
    constructor(x, y, color, size, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.lifetime = 1.0; // От 1 до 0
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.lifetime -= 0.02;
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.lifetime;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            x,
            y,
            'orange',
            Math.random() * 3 + 2,
            Math.random() * 3 + 1
        ));
    }
}

// Функция отрисовки
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Отрисовка оружия на земле
    weaponsOnGround.forEach(weapon => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(weapon.position.x, weapon.position.y, 20, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(weapon.name, weapon.position.x, weapon.position.y - 5);
    });

    if (player.isAlive) {
        // Отрисовка полоски здоровья игрока
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthPercentage = player.health / player.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth * healthPercentage, healthBarHeight);

        // Отрисовка игрока
        ctx.drawImage(playerImage, player.position.x, player.position.y, 50, 50);

        // Отображение текущего оружия
        if (player.weapon) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`Оружие: ${player.weapon.name}`, player.position.x, player.position.y - 15);
        }
    }

    // Обновление и отрисовка частиц
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
        
        // Отрисовка тела врага
        ctx.fillRect(enemy.position.x, enemy.position.y, 30, 30);

        // Отрисовка полоски здоровья врага
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = 'darkred';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'lime';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth * healthPercentage, healthBarHeight);
    });

    // Отображение текущего здоровья и счета
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Здоровье: ${player.health}/${player.maxHealth}`, 10, canvas.height - 30);
    ctx.fillText(`Счет: ${player.score}`, 10, canvas.height - 10);
}

// Игровой цикл
function gameLoop() {
    enemies.forEach(enemy => enemy.moveTowards(player));
    draw();
    displayScores();
    requestAnimationFrame(gameLoop);
}

// Запуск игры
requestAnimationFrame(gameLoop);
