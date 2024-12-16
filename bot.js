require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Токен вашего бота
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Установка вебхука
const url = process.env.APP_URL; // URL, предоставленный Render
bot.setWebHook(`${url}/bot${token}`);

// Обработка обновлений
const app = express();
app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
