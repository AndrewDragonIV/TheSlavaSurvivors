require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Настройка бота с явным указанием настроек promises
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { 
    polling: true,
    cancelable: true // Явно включаем отмену промисов
});

// Middleware для статических файлов
app.use(express.static(path.join(__dirname)));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Основной маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка команд бота
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать в The Slava Survivors! Нажмите кнопку ниже, чтобы начать игру:', {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🎮 Играть',
                    web_app: { url: process.env.WEBAPP_URL }
                }]
            ]
        }
    }).catch(error => {
        console.error('Error sending message:', error);
    });
});

// Обработка ошибок бота
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    bot.stopPolling();
    process.exit(0);
});
