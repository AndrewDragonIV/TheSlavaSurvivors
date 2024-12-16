import { RESOURCES, Particle, Weapon, Player, Enemy, createExplosion, generateRandomWeapon } from './game.js';

// Глобальные переменные
const particles = [];
const enemies = [];
const weaponsOnGround = [];
window.player = new Player('Slavik');
const player = window.player;

// Инициализация игрового поля
const gameContainer = document.getElementById('game-container');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
gameContainer.appendChild(canvas);

// Система очков
const scores = [];

// Обработка событий касания
let isTouching = false;
let targetPosition = { x: 400, y: 300 };

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    isTouching = true;
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    targetPosition.x = touch.clientX - rect.left;
    targetPosition.y = touch.clientY - rect.top;
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (isTouching) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        targetPosition.x = touch.clientX - rect.left;
        targetPosition.y = touch.clientY - rect.top;
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isTouching = false;
});

// Для тестирования на ПК
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    targetPosition.x = event.clientX - rect.left;
    targetPosition.y = event.clientY - rect.top;
    isTouching = true;
});

canvas.addEventListener('mousemove', (event) => {
    if (isTouching) {
        const rect = canvas.getBoundingClientRect();
        targetPosition.x = event.clientX - rect.left;
        targetPosition.y = event.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', () => {
    isTouching = false;
});

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
    const minDistance = 200;
    
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        const distance = Math.sqrt(
            Math.pow(x - player.position.x, 2) + 
            Math.pow(y - player.position.y, 2)
        );
        if (distance >= minDistance) break;
    } while (true);

    let enemyType = 'basic';
    const spawnChance = Math.random();
    
    if (player.level >= 10) {
        if (spawnChance < 0.1) enemyType = 'boss';
        else if (spawnChance < 0.3) enemyType = 'tank';
        else if (spawnChance < 0.5) enemyType = 'fast';
        else if (spawnChance < 0.7) enemyType = 'fire';
    } else if (player.level >= 5) {
        if (spawnChance < 0.2) enemyType = 'tank';
        else if (spawnChance < 0.4) enemyType = 'fast';
        else if (spawnChance < 0.6) enemyType = 'fire';
    } else if (player.level >= 3) {
        if (spawnChance < 0.3) enemyType = 'fast';
        else if (spawnChance < 0.5) enemyType = 'fire';
    }

    const enemy = new Enemy(enemyType);
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

// Показать экран выбора оружия
function showWeaponSelection() {
    const startingWeapons = [
        new Weapon('Меч', 25, 'silver', 'melee', { type: 'burn', damage: 10 }),
        new Weapon('Лук', 15, 'green', 'ranged', { type: 'poison', damage: 5 }),
        new Weapon('Посох льда', 20, 'cyan', 'magic', { type: 'freeze', slowFactor: 0.5 })
    ];

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Выберите начальное оружие', canvas.width / 2, 100);
    
    startingWeapons.forEach((weapon, index) => {
        const x = canvas.width / 4 + (index * canvas.width / 4);
        const y = canvas.height / 2;
        
        // Рамка выбора
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 30, y - 30, 60, 60);
        
        // Оружие
        ctx.fillStyle = weapon.color;
        ctx.fillRect(x - 25, y - 25, 50, 50);
        
        // Информация об оружии
        ctx.fillStyle = 'white';
        ctx.fillText(weapon.name, x, y + 50);
        ctx.fillText(`Урон: ${weapon.damage}`, x, y + 75);
        ctx.fillText(`Эффект: ${weapon.special.type}`, x, y + 100);
    });

    return new Promise(resolve => {
        function handleWeaponSelect(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.type === 'click' ? event.clientX - rect.left : event.touches[0].clientX - rect.left;
            const y = event.type === 'click' ? event.clientY - rect.top : event.touches[0].clientY - rect.top;
            
            startingWeapons.forEach((weapon, index) => {
                const weaponX = canvas.width / 4 + (index * canvas.width / 4);
                const weaponY = canvas.height / 2;
                
                if (x >= weaponX - 30 && x <= weaponX + 30 &&
                    y >= weaponY - 30 && y <= weaponY + 30) {
                    canvas.removeEventListener('click', handleWeaponSelect);
                    canvas.removeEventListener('touchstart', handleWeaponSelect);
                    player.addWeapon(weapon);
                    resolve();
                }
            });
        }
        
        canvas.addEventListener('click', handleWeaponSelect);
        canvas.addEventListener('touchstart', handleWeaponSelect);
    });
}

// Функция поиска ближайшего врага
function findNearestEnemy() {
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
        if (!enemy.isAlive) return;
        
        const distance = Math.sqrt(
            Math.pow(player.position.x - enemy.position.x, 2) +
            Math.pow(player.position.y - enemy.position.y, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    return nearestEnemy;
}

// Функция инициализации игры
async function initGame() {
    await showWeaponSelection();
    
    // Создаем начальных врагов после выбора оружия
    for (let i = 0; i < 5; i++) {
        spawnEnemy();
    }
    
    // Запускаем игровой цикл
    requestAnimationFrame(gameLoop);
}

// Система уровней
let currentLevel = 1;
let enemiesKilledOnLevel = 0;
const ENEMIES_TO_NEXT_LEVEL = 20;

function startNextLevel() {
    currentLevel++;
    enemiesKilledOnLevel = 0;
    enemies.length = 0;
    
    // Эффект перехода
    const colors = ['gold', 'yellow', 'white'];
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 4 + 2,
            Math.random() * 5 + 3
        ));
    }
    
    // Новые враги
    const baseEnemies = 5 + Math.floor(currentLevel * 1.5);
    for (let i = 0; i < baseEnemies; i++) {
        spawnEnemy();
    }
    
    // Восстановление здоровья
    player.health = Math.min(player.health + player.maxHealth * 0.3, player.maxHealth);
}

// Автоматическая атака
setInterval(() => {
    if (player.isAlive) {
        const nearestEnemy = findNearestEnemy();
        if (nearestEnemy) {
            player.attack(particles, [nearestEnemy]);
        }
    }
}, 400);

// Игровые циклы
setInterval(() => {
    const maxEnemies = 12 + Math.floor(currentLevel * 2);
    if (enemies.length < maxEnemies) {
        spawnEnemy();
    }
}, 3000);

setInterval(spawnWeapon, 10000);

function checkWeaponPickup() {
    for (let i = weaponsOnGround.length - 1; i >= 0; i--) {
        const weapon = weaponsOnGround[i];
        const distance = Math.sqrt(
            Math.pow(player.position.x - weapon.position.x, 2) +
            Math.pow(player.position.y - weapon.position.y, 2)
        );
        
        if (distance < 50) {
            player.addWeapon(weapon);
            weaponsOnGround.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка фона с текстурой
    const pattern = ctx.createPattern(RESOURCES.background, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Оружие на земле
    weaponsOnGround.forEach(weapon => {
        ctx.fillStyle = weapon.color;
        ctx.fillRect(weapon.position.x, weapon.position.y, 20, 20);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, weapon.position.x + 10, weapon.position.y - 10);
        
        if (weapon.special) {
            ctx.font = '10px Arial';
            ctx.fillStyle = weapon.color;
            ctx.fillText(weapon.special.type, weapon.position.x + 10, weapon.position.y - 25);
            
            ctx.fillStyle = 'orange';
            ctx.fillText(`${weapon.damage} DMG`, weapon.position.x + 10, weapon.position.y + 30);
        }
    });

    // Частицы
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw(ctx);
        if (particle.lifetime <= 0) {
            particles.splice(index, 1);
        }
    });

    // Враги
    enemies.forEach(enemy => {
        if (enemy.flashTime && Date.now() - enemy.flashTime < 100) {
            ctx.fillStyle = 'white';
        } else {
            ctx.fillStyle = enemy.color;
        }
        
        let enemySize = enemy.type === 'boss' ? 50 : 
                       enemy.type === 'tank' ? 40 : 30;
        
        ctx.fillRect(
            enemy.position.x, 
            enemy.position.y, 
            enemySize, 
            enemySize
        );

        // Полоска здоровья врага
        const healthBarWidth = enemySize;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = 'darkred';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'lime';
        ctx.fillRect(enemy.position.x, enemy.position.y - 8, healthBarWidth * healthPercentage, healthBarHeight);

        // Тип врага
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.type, enemy.position.x + enemySize/2, enemy.position.y - 12);

        // Активные эффекты врага
        if (enemy.activeEffects.length > 0) {
            const effectColors = {
                poison: '#00ff00',
                freeze: '#00ffff',
                burn: '#ff4400'
            };
            
            enemy.activeEffects.forEach((effect, index) => {
                const timeLeft = effect.duration - (Date.now() - effect.startTime);
                if (timeLeft > 0) {
                    ctx.fillStyle = effectColors[effect.type] || 'white';
                    ctx.beginPath();
                    ctx.arc(
                        enemy.position.x + enemySize + 10,
                        enemy.position.y + 10 + index * 15,
                        5,
                        0,
                        Math.PI * 2 * (timeLeft / effect.duration)
                    );
                    ctx.fill();
                    
                    ctx.fillText(
                        effect.type,
                        enemy.position.x + enemySize + 25,
                        enemy.position.y + 12 + index * 15
                    );
                }
            });
        }
    });

    // Игрок
    if (player.isAlive) {
        if (player.flashTime && Date.now() - player.flashTime < 100) {
            ctx.globalAlpha = 0.7;
        }

        ctx.drawImage(RESOURCES.player, player.position.x, player.position.y, 50, 50);
        ctx.globalAlpha = 1;

        // Полоска здоровья игрока
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthPercentage = player.health / player.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(player.position.x, player.position.y - 10, healthBarWidth * healthPercentage, healthBarHeight);

        // Текущее оружие
        if (player.weapon) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            const weaponText = player.weapon.special ? 
                `${player.weapon.name} (${player.weapon.special.type})` : 
                player.weapon.name;
            ctx.fillText(weaponText, player.position.x + 25, player.position.y - 15);
        }

        // Активные эффекты игрока
        if (player.activeEffects.length > 0) {
            const effectColors = {
                poison: '#00ff00',
                freeze: '#00ffff',
                burn: '#ff4400'
            };
            
            player.activeEffects.forEach((effect, index) => {
                const timeLeft = effect.duration - (Date.now() - effect.startTime);
                if (timeLeft > 0) {
                    ctx.fillStyle = effectColors[effect.type] || 'white';
                    ctx.beginPath();
                    ctx.arc(
                        player.position.x + 60,
                        player.position.y + 10 + index * 15,
                        5,
                        0,
                        Math.PI * 2 * (timeLeft / effect.duration)
                    );
                    ctx.fill();
                    
                    ctx.fillText(
                        effect.type,
                        player.position.x + 75,
                        player.position.y + 12 + index * 15
                    );
                }
            });
        }
    }

    // Интерфейс
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Здоровье: ${Math.floor(player.health)}/${player.maxHealth}`, 10, canvas.height - 90);
    ctx.fillText(`Счет: ${player.score}`, 10, canvas.height - 70);
    
    const baseDamage = player.weapon ? player.weapon.damage : 10;
    const damageBonus = (player.stats.strength - 1) * 0.2 * 100;
    ctx.fillText(`Уровень персонажа: ${player.level}`, 10, canvas.height - 50);
    ctx.fillText(`Урон: ${baseDamage} (+${damageBonus.toFixed(0)}%)`, 10, canvas.height - 30);
    
    ctx.fillStyle = '#ffff00';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Уровень ${currentLevel}`, canvas.width / 2, 30);
    ctx.font = '16px Arial';
    ctx.fillText(`Убито врагов: ${enemiesKilledOnLevel}/${ENEMIES_TO_NEXT_LEVEL}`, canvas.width / 2, 55);
    
    // Полоска опыта
    const xpBarWidth = 200;
    const xpBarHeight = 4;
    const xpPercentage = player.experience / player.experienceToNextLevel;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(10, canvas.height - 20, xpBarWidth, xpBarHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, canvas.height - 20, xpBarWidth * xpPercentage, xpBarHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(`${player.experience}/${player.experienceToNextLevel} XP`, 220, canvas.height - 18);

    // Характеристики
    ctx.textAlign = 'right';
    ctx.fillText(`Сила: ${player.stats.strength}`, canvas.width - 10, canvas.height - 70);
    ctx.fillText(`Ловкость: ${player.stats.agility}`, canvas.width - 10, canvas.height - 50);
    ctx.fillText(`Живучесть: ${player.stats.vitality}`, canvas.width - 10, canvas.height - 30);

    ctx.textAlign = 'left';
    displayScores();
}

function gameLoop() {
    if (player.isAlive) {
        checkWeaponPickup();

        if (isTouching) {
            const dx = targetPosition.x - player.position.x;
            const dy = targetPosition.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                const speed = 5;
                player.position.x += (dx / distance) * speed;
                player.position.y += (dy / distance) * speed;
                
                player.position.x = Math.max(0, Math.min(canvas.width - 50, player.position.x));
                player.position.y = Math.max(0, Math.min(canvas.height - 50, player.position.y));
            }
        }

        player.updateEffects(particles);
        
        enemies.forEach((enemy, index) => {
            if (!enemy.isAlive) {
                enemies.splice(index, 1);
                return;
            }
            enemy.moveTowards(player, particles);
            enemy.updateEffects(particles);
        });
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Слушаем события игры
window.addEventListener('gameOver', (event) => {
    updateScores(player.name, event.detail.score);
});

window.addEventListener('enemyKilled', (event) => {
    player.score += event.detail.score;
    const experienceGain = event.detail.experience || 10;
    player.gainExperience(experienceGain);
    
    enemiesKilledOnLevel++;
    if (enemiesKilledOnLevel >= ENEMIES_TO_NEXT_LEVEL) {
        startNextLevel();
    }
});

// Запуск игры
initGame();
