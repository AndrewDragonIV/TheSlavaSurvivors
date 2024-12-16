// Загрузка игровых ресурсов
export const RESOURCES = {
    player: new Image(),
    background: new Image()
};

// Инициализация ресурсов
RESOURCES.player.src = '/assets/slavik.png';
RESOURCES.background.src = '/assets/background.png';

// Система частиц для эффектов
export class Particle {
    constructor(x, y, color, size, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.lifetime = 1.0;
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

// Класс оружия
export class Weapon {
    constructor(name, damage, color, type, special) {
        this.name = name;
        this.damage = damage;
        this.color = color;
        this.position = { x: 0, y: 0 };
        this.type = type;
        this.special = special;
        this.level = 1;
        this.description = this.generateDescription();
    }

    generateDescription() {
        let desc = `${this.name} (${this.type})\n`;
        desc += `Урон: ${this.damage}\n`;
        if (this.special) {
            desc += `Эффект: ${this.special.type}`;
            if (this.special.damage) desc += ` (${this.special.damage} урона)`;
            if (this.special.slowFactor) desc += ` (замедление ${(1 - this.special.slowFactor) * 100}%)`;
        }
        return desc;
    }

    applySpecial(target, particles) {
        if (this.special) {
            switch (this.special.type) {
                case 'poison':
                    target.addEffect({
                        type: 'poison',
                        damage: this.damage * 0.2,
                        duration: 3000,
                        tickInterval: 500
                    });
                    break;
                case 'freeze':
                    target.addEffect({
                        type: 'freeze',
                        slowFactor: 0.5,
                        duration: 2000
                    });
                    break;
                case 'burn':
                    createExplosion(target.position.x, target.position.y, particles);
                    target.addEffect({
                        type: 'burn',
                        damage: this.special.damage,
                        duration: 4000,
                        tickInterval: 500
                    });
                    break;
            }
        }
    }

    upgrade() {
        this.level++;
        this.damage = Math.floor(this.damage * 1.2);
        if (this.special && this.special.damage) {
            this.special.damage = Math.floor(this.special.damage * 1.2);
        }
        this.description = this.generateDescription();
    }

    combine(otherWeapon) {
        if (this.type === otherWeapon.type) {
            const combinedWeapon = new Weapon(
                `Усиленный ${this.name}`,
                Math.floor((this.damage + otherWeapon.damage) * 1.5),
                this.color,
                this.type,
                {
                    ...this.special,
                    damage: this.special.damage ? Math.floor((this.special.damage + otherWeapon.special.damage) * 1.5) : null
                }
            );
            combinedWeapon.level = Math.max(this.level, otherWeapon.level) + 1;
            return combinedWeapon;
        } else {
            return new Weapon(
                `${this.name}-${otherWeapon.name}`,
                Math.floor((this.damage + otherWeapon.damage) * 1.2),
                this.color,
                'hybrid',
                {
                    type: 'combo',
                    effects: [this.special, otherWeapon.special]
                }
            );
        }
    }
}

// Класс игрока
export class Player {
    constructor(name) {
        this.name = name;
        this.health = 200;
        this.maxHealth = 200;
        this.position = { x: 400, y: 300 };
        this.weapons = [];
        this.activeWeaponIndex = 0;
        this.score = 0;
        this.isAlive = true;
        this.attackTime = 0;
        this.attackCooldown = 400;
        this.flashTime = 0;
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.activeEffects = [];
        this.stats = {
            strength: 1,
            agility: 1,
            vitality: 1
        };
    }

    addWeapon(weapon) {
        const similarWeaponIndex = this.weapons.findIndex(w => w.type === weapon.type);
        if (similarWeaponIndex !== -1) {
            const combinedWeapon = this.weapons[similarWeaponIndex].combine(weapon);
            this.weapons[similarWeaponIndex] = combinedWeapon;
        } else {
            this.weapons.push(weapon);
            if (this.weapons.length === 1) {
                this.activeWeaponIndex = 0;
            }
        }
    }

    get weapon() {
        return this.weapons[this.activeWeaponIndex];
    }

    switchWeapon() {
        if (this.weapons.length > 1) {
            this.activeWeaponIndex = (this.activeWeaponIndex + 1) % this.weapons.length;
        }
    }

    gainExperience(amount) {
        this.experience += amount;
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        this.stats.strength += 1;
        this.stats.agility += 1;
        this.stats.vitality += 1;
        
        this.maxHealth = 200 + (this.stats.vitality - 1) * 20;
        this.health = this.maxHealth;
        this.attackCooldown = Math.max(200, 400 - (this.stats.agility - 1) * 20);
        
        if (this.weapon) {
            this.weapon.upgrade();
        }
    }

    updateEffects(particles) {
        const currentTime = Date.now();
        
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            
            if (currentTime - effect.startTime >= effect.duration) {
                this.activeEffects.splice(i, 1);
                continue;
            }

            switch (effect.type) {
                case 'poison':
                    if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                        this.takeDamage(effect.damage, particles);
                        effect.lastTickTime = currentTime;
                        particles.push(new Particle(
                            this.position.x + Math.random() * 50,
                            this.position.y + Math.random() * 50,
                            '#00ff00',
                            Math.random() * 2 + 1,
                            Math.random() * 2 + 1
                        ));
                    }
                    break;
                case 'burn':
                    if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                        this.takeDamage(effect.damage, particles);
                        effect.lastTickTime = currentTime;
                        particles.push(new Particle(
                            this.position.x + Math.random() * 50,
                            this.position.y + Math.random() * 50,
                            '#ff4400',
                            Math.random() * 3 + 1,
                            Math.random() * 3 + 2
                        ));
                    }
                    break;
            }
        }
    }

    attack(particles, enemies) {
        const currentTime = Date.now();
        if (!this.isAlive || currentTime - this.attackTime < this.attackCooldown) return 0;
        
        this.attackTime = currentTime;
        let totalDamage = 0;
        
        if (this.weapons.length > 0) {
            this.weapons.forEach(weapon => {
                const enemy = this.findNearestEnemy(enemies);
                if (!enemy) return;
                
                const dx = enemy.position.x - this.position.x;
                const dy = enemy.position.y - this.position.y;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                for (let i = 0; i < 5; i++) {
                    const spread = (Math.random() - 0.5) * 0.5;
                    const speed = Math.random() * 2 + 4;
                    
                    const particle = new Particle(
                        this.position.x + 25,
                        this.position.y + 25,
                        weapon.color,
                        Math.random() * 2 + 1,
                        speed
                    );
                    
                    particle.angle = angle + spread;
                    particles.push(particle);
                }
                
                const weaponDamage = weapon.damage * (1 + (this.stats.strength - 1) * 0.2);
                
                if (distance < 300) {
                    enemy.takeDamage(weaponDamage, particles);
                    weapon.applySpecial(enemy, particles);
                    totalDamage += weaponDamage;
                }
            });
        } else {
            const enemy = this.findNearestEnemy(enemies);
            if (!enemy) return 0;
            
            const dx = enemy.position.x - this.position.x;
            const dy = enemy.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                const angle = Math.atan2(dy, dx);
                for (let i = 0; i < 3; i++) {
                    const spread = (Math.random() - 0.5) * 1.0;
                    const speed = Math.random() * 2 + 2;
                    
                    const particle = new Particle(
                        this.position.x + 25,
                        this.position.y + 25,
                        'white',
                        Math.random() * 2 + 1,
                        speed
                    );
                    
                    particle.angle = angle + spread;
                    particles.push(particle);
                }
                
                const baseDamage = 10;
                totalDamage = baseDamage * (1 + (this.stats.strength - 1) * 0.2);
                enemy.takeDamage(totalDamage, particles);
            }
        }
        
        return totalDamage;
    }

    findNearestEnemy(enemies) {
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (!enemy.isAlive) return;
            
            const dx = enemy.position.x - this.position.x;
            const dy = enemy.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        return nearestEnemy;
    }

    takeDamage(damage, particles) {
        if (!this.isAlive) return;
        this.health = Math.max(0, this.health - damage);
        this.flashTime = Date.now();
        
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                this.position.x + 25,
                this.position.y + 25,
                'red',
                Math.random() * 3 + 1,
                Math.random() * 4 + 2
            ));
        }
        
        if (this.health <= 0) {
            this.isAlive = false;
            createExplosion(this.position.x + 25, this.position.y + 25, particles);
            const gameOverEvent = new CustomEvent('gameOver', { 
                detail: { score: this.score } 
            });
            window.dispatchEvent(gameOverEvent);
        }
    }

    addEffect(effect) {
        this.activeEffects.push({
            ...effect,
            startTime: Date.now(),
            lastTickTime: Date.now()
        });
    }
}

// Класс врага
export class Enemy {
    constructor(type) {
        const enemyTypes = {
            basic: {
                health: 30,
                speed: 1.0,
                damage: 3,
                color: 'red',
                experience: 8
            },
            fire: {
                health: 25,
                speed: 1.3,
                damage: 2,
                color: '#ff4400',
                experience: 10,
                effect: {
                    type: 'burn',
                    damage: 1,
                    duration: 3000,
                    tickInterval: 500
                }
            },
            fast: {
                health: 20,
                speed: 1.8,
                damage: 2,
                color: 'yellow',
                experience: 12
            },
            tank: {
                health: 60,
                speed: 0.6,
                damage: 5,
                color: 'purple',
                experience: 15
            },
            boss: {
                health: 150,
                speed: 0.8,
                damage: 8,
                color: 'crimson',
                experience: 50
            }
        };

        const stats = enemyTypes[type] || enemyTypes.basic;
        
        this.type = type;
        this.health = stats.health;
        this.maxHealth = stats.health;
        this.position = {
            x: Math.random() * 800,
            y: Math.random() * 600
        };
        this.speed = stats.speed;
        this.baseDamage = stats.damage;
        this.color = stats.color;
        this.experience = stats.experience;
        this.effect = stats.effect;
        this.lastAttackTime = 0;
        this.attackCooldown = 1500;
        this.isAlive = true;
        this.flashTime = 0;
        this.activeEffects = [];
    }

    addEffect(effect) {
        this.activeEffects.push({
            ...effect,
            startTime: Date.now(),
            lastTickTime: Date.now()
        });
    }

    updateEffects(particles) {
        const currentTime = Date.now();
        this.speed = this.baseDamage / 5;
        
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            
            if (currentTime - effect.startTime >= effect.duration) {
                this.activeEffects.splice(i, 1);
                continue;
            }

            switch (effect.type) {
                case 'poison':
                    if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                        this.takeDamage(effect.damage, particles);
                        effect.lastTickTime = currentTime;
                        particles.push(new Particle(
                            this.position.x + 15,
                            this.position.y + 15,
                            '#00ff00',
                            Math.random() * 2 + 1,
                            Math.random() * 2 + 1
                        ));
                    }
                    break;
                case 'freeze':
                    this.speed *= effect.slowFactor;
                    if (Math.random() < 0.1) {
                        particles.push(new Particle(
                            this.position.x + Math.random() * 30,
                            this.position.y + Math.random() * 30,
                            '#00ffff',
                            Math.random() * 2 + 1,
                            Math.random() * 1 + 0.5
                        ));
                    }
                    break;
                case 'burn':
                    if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                        this.takeDamage(effect.damage, particles);
                        effect.lastTickTime = currentTime;
                        particles.push(new Particle(
                            this.position.x + Math.random() * 30,
                            this.position.y + Math.random() * 30,
                            '#ff4400',
                            Math.random() * 3 + 1,
                            Math.random() * 3 + 2
                        ));
                    }
                    break;
            }
        }
    }

    takeDamage(damage, particles) {
        if (!this.isAlive) return;
        this.health = Math.max(0, this.health - damage);
        this.flashTime = Date.now();
        
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(
                this.position.x + 15,
                this.position.y + 15,
                'red',
                Math.random() * 2 + 1,
                Math.random() * 3 + 1
            ));
        }
        
        if (this.health <= 0) {
            this.isAlive = false;
            createExplosion(this.position.x + 15, this.position.y + 15, particles);
            
            const killEvent = new CustomEvent('enemyKilled', { 
                detail: { 
                    score: Math.floor(this.maxHealth / 10) + 5,
                    experience: this.experience
                }
            });
            window.dispatchEvent(killEvent);
        }
    }

    moveTowards(target, particles) {
        if (!this.isAlive || !target.isAlive) return;
        
        const dx = target.position.x - this.position.x;
        const dy = target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.position.x += (dx / distance) * this.speed;
            this.position.y += (dy / distance) * this.speed;
        }

        if (distance < 50) {
            this.attack(target, particles);
        }
    }

    attack(target, particles) {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            target.takeDamage(this.baseDamage, particles);
            this.lastAttackTime = currentTime;
            
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(
                    target.position.x + 25,
                    target.position.y + 25,
                    this.color,
                    Math.random() * 2 + 1,
                    Math.random() * 3 + 1
                ));
            }

            if (this.effect) {
                target.addEffect({...this.effect});
            }
        }
    }
}

// Функция создания взрыва
export function createExplosion(x, y, particles) {
    const colors = ['orange', 'yellow', 'red'];
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            x,
            y,
            colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 3 + 2,
            Math.random() * 3 + 1
        ));
    }
}

// Функция генерации случайного оружия
export function generateRandomWeapon() {
    const weaponTypes = [
        {
            name: 'Меч',
            type: 'melee',
            damage: 15,
            color: 'silver',
            special: { type: 'burn', damage: 5 }
        },
        {
            name: 'Лук',
            type: 'ranged',
            damage: 10,
            color: 'green',
            special: { type: 'poison', damage: 3 }
        },
        {
            name: 'Дробовик',
            type: 'ranged',
            damage: 20,
            color: 'orange',
            special: { type: 'burn', damage: 8 }
        },
        {
            name: 'Посох льда',
            type: 'magic',
            damage: 12,
            color: 'cyan',
            special: { type: 'freeze', slowFactor: 0.6 }
        },
        {
            name: 'Огненный жезл',
            type: 'magic',
            damage: 18,
            color: 'red',
            special: { type: 'burn', damage: 7 }
        }
    ];

    const selectedWeapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    return new Weapon(
        selectedWeapon.name,
        selectedWeapon.damage,
        selectedWeapon.color,
        selectedWeapon.type,
        selectedWeapon.special
    );
}
