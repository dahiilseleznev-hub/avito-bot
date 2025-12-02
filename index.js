const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const sheetURL = process.env.SHEET_URL;

const bot = new TelegramBot(token, { polling: true });

// Парсер
function parseOrder(text) {
  const items = [];
  const regex = /(\w+)\s*(\d+)\s*шт\s*(?:размер)?\s*(\w+)/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    items.push({
      color: match[1],
      count: Number(match[2]),
      size: match[3]
    });
  }
  return items;
}

function getPrice(size) {
  return 350;
}

function getCost(size) {
  return 180;
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const items = parseOrder(text);

  if (items.length === 0) {
    return bot.sendMessage(chatId, "Не понял заказ. Пример: Белые 2 шт XL");
  }

  for (const item of items) {
    const price = getPrice(item.size);
    const cost = getCost(item.size);
    const margin = price - cost;

    const payload = {
      client: msg.from.first_name,
      color: item.color,
      size: item.size,
      count: item.count,
      price: price * item.count,
      cost: cost * item.count,
      margin: margin * item.count
    };

    await axios.post(sheetURL, payload);
  }

  let response = "Заказ принят:\n";
  items.forEach(i => {
    response += `${i.color} ${i.size} — ${i.count} шт\n`;
  });
  response += "\nСкопируй и вставь клиенту на Авито:\n";
  response += "Ваш заказ принят👌 Когда он будет готов к отправке — я напишу вам. Если хотите перейти на связь с продавцом — отправьте 0.";

  bot.sendMessage(chatId, response);
});
