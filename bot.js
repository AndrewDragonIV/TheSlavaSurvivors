const TelegramBot = require('node-telegram-bot-api');

// Токен вашего бота
const token = '8082097658:AAES_GleVt3jlZirou-y8yGdC0jN23BZCZA';
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
