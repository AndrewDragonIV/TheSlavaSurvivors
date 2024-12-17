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

// Функция для преобразования координат касания
function getTouchPosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (event.type.startsWith('touch')) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Обработчики касаний для движения
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    isTouching = true;
    const pos = getTouchPosition(event, canvas);
    targetPosition = pos;
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (isTouching) {
        const pos = getTouchPosition(event, canvas);
        targetPosition = pos;
    }
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    isTouching = false;
}, { passive: false });

// Для тестирования на ПК
canvas.addEventListener('mousedown', (event) => {
    const pos = getTouchPosition(event, canvas);
    targetPosition = pos;
    isTouching = true;
});

canvas.addEventListener('mousemove', (event) => {
    if (isTouching) {
        const pos = getTouchPosition(event, canvas);
        targetPosition = pos;
    }
});

canvas.addEventListener('mouseup', () => {
    isTouching = false;
});

// Показать экран выбора оружия
function showWeaponSelection() {
    const startingWeapons = [
        new Weapon('Меч', 25, 'silver', 'melee', { type: 'burn', damage: 10 }),
        new Weapon('Лук', 15, 'green', 'ranged', { type: 'poison', damage: 5 }),
        new Weapon('Посох льда', 20, 'cyan', 'magic', { type: 'freeze', slowFactor: 0.5 })
    ];

    // Увеличим размер кнопок и расстояние между ними
    const buttonSize = 100; // Увеличенный размер кнопки
    const spacing = canvas.width / 4;

    function drawWeaponSelection() {
        // Очищаем канвас
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Заголовок
        ctx.fillStyle = 'white';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Выберите начальное оружие', canvas.width / 2, 100);
        
        // Отрисовка кнопок выбора оружия
        startingWeapons.forEach((weapon, index) => {
            const x = spacing + (index * spacing);
            const y = canvas.height / 2;
            
            // Тень для кнопки
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = 15;
            
            // Рамка кнопки
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x - buttonSize/2, y - buttonSize/2, buttonSize, buttonSize);
            
            // Заливка кнопки
            ctx.fillStyle = `${weapon.color}33`; // Полупрозрачный цвет
            ctx.fillRect(x - buttonSize/2, y - buttonSize/2, buttonSize, buttonSize);
            
            // Сброс тени
            ctx.shadowBlur = 0;
            
            // Информация об оружии
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(weapon.name, x, y + buttonSize);
            ctx.font = '16px Arial';
            ctx.fillText(`Урон: ${weapon.damage}`, x, y + buttonSize + 30);
            ctx.fillText(weapon.special.type, x, y + buttonSize + 55);
        });
    }

    return new Promise(resolve => {
        function handleWeaponSelect(event) {
            event.preventDefault();
            
            const pos = getTouchPosition(event, canvas);
            console.log('Touch position:', pos.x, pos.y);
            
            startingWeapons.forEach((weapon, index) => {
                const buttonX = spacing + (index * spacing);
                const buttonY = canvas.height / 2;
                
                // Проверяем попадание в увеличенную область кнопки
                if (pos.x >= buttonX - buttonSize/2 && pos.x <= buttonX + buttonSize/2 &&
                    pos.y >= buttonY - buttonSize/2 && pos.y <= buttonY + buttonSize/2) {
                    console.log('Selected weapon:', weapon.name);
                    
                    // Визуальный эффект нажатия
                    ctx.fillStyle = weapon.color;
                    ctx.fillRect(buttonX - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize);
                    
                    // Удаляем обработчики событий
                    canvas.removeEventListener('click', handleWeaponSelect);
                    canvas.removeEventListener('touchstart', handleWeaponSelect);
                    
                    // Добавляем оружие игроку
                    player.addWeapon(weapon);
                    
                    // Небольшая задержка для отображения эффекта нажатия
                    setTimeout(() => resolve(), 100);
                }
            });
        }

        // Отрисовываем интерфейс выбора
        drawWeaponSelection();
        
        // Добавляем обработчики
        canvas.addEventListener('click', handleWeaponSelect);
        canvas.addEventListener('touchstart', handleWeaponSelect, { passive: false });
    });
}

// Остальной код игры остается без изменений...
// (Здесь должны быть все остальные функции из предыдущей версии main.js)

// Инициализация игры
initGame();
