import { Telegraf } from "telegraf";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Токен берём из Environment
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is not defined. Проверь Environment Variables в Render!");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("Привет! Пришли ссылку на YouTube — я пришлю голосовое 🎧");
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;
  const chatId = ctx.chat.id;

  // Имя временного файла
  const fileName = path.resolve(`audio_${Date.now()}.ogg`);

  await ctx.reply("⏳ Загружаю и конвертирую аудио... Это может занять время для длинных видео.");

  // Команда yt-dlp + ffmpeg для конвертации в opus (ogg)
  const cmd = `
    yt-dlp -f bestaudio \
    -o "${fileName}" \
    --extract-audio \
    --audio-format opus \
    --audio-quality 0 \
    "${url}"
  `;

  exec(cmd, async (error) => {
    if (error) {
      console.error(error);
      ctx.reply("❌ Ошибка при скачивании/конвертации");
      return;
    }

    // Отправляем как голосовое сообщение
    try {
      await ctx.replyWithVoice({ source: fs.createReadStream(fileName) });
    } catch (err) {
      console.error(err);
      ctx.reply("❌ Ошибка при отправке аудио");
    } finally {
      // Удаляем временный файл
      fs.unlinkSync(fileName);
    }
  });
});

bot.launch();

console.log("✅ Бот запущен");
