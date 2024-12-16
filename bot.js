require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Токен вашего бота
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать в игру! Используйте /play для начала.');
});

// Обработка команды /play
bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Игра начинается! Удачи!');
});

// Обработка других сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Пожалуйста, используйте команды /start или /play.');
});
