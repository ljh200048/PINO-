import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // CORS middleware to support strict browser privacy/incognito environments (e.g. inside iframes)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API endpoint for sending Telegram notifications (stealth alias to bypass strict privacy blockers/adblockers in Incognito mode)
  const handleTelegramNotification = async (req: express.Request, res: express.Response) => {
    try {
      const {
        className,
        userName,
        phone,
        email,
        date,
        time,
        participantsCount,
        itemToMake,
        request,
      } = req.body;

      // Extract Telegram settings from environment variables
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        console.warn(
          "⚠️ Telegram Notification Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not defined in environment variables."
        );
        return res.status(200).json({
          success: false,
          message: "Telegram API is not configured on this server.",
        });
      }

      // Build text message for Telegram
      const messageText = [
        "🔔 [PINO공방] 새로운 무료 클래스 신청 완료!",
        "",
        `📍 클래스: ${className || "무료 클래스"}`,
        `👤 신청자: ${userName} 님`,
        `📞 연락처: ${phone}`,
        `✉️ 이메일: ${email || "없음"}`,
        `📅 예약일: ${date}`,
        `⏰ 예약시간: ${time}`,
        `👥 인원: ${participantsCount}명`,
        `🧸 제작항목: ${itemToMake}`,
        `💬 요청사항: ${request || "없음"}`,
        "",
        "관리자 페이지에서 승인 여부를 검토해주세요! 🐾",
      ].join("\n");

      // Dispatch request to Telegram API
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Telegram Bot API Error Response:", errorText);
        return res.status(500).json({
          success: false,
          error: "Failed to send notification to Telegram.",
        });
      }

      console.log("✅ Telegram notification sent successfully!");
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("❌ Error in notify-telegram endpoint:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  };

  app.post("/api/notify-telegram", handleTelegramNotification);
  app.post("/api/dispatch-booking-alert", handleTelegramNotification);

  // Support serving SEO assets and search engine verification files (like sitemap.xml, robots.txt, naver/google verification HTML/XML)
  // directly from the project root or public folder in both development and production.
  app.get("/:filename", (req, res, next) => {
    const filename = req.params.filename;
    if (filename.endsWith(".xml") || filename.endsWith(".txt") || filename.endsWith(".html")) {
      if (filename === "index.html") {
        return next();
      }
      const rootPath = path.join(process.cwd(), filename);
      const publicPath = path.join(process.cwd(), "public", filename);
      
      res.sendFile(rootPath, (err) => {
        if (err) {
          res.sendFile(publicPath, (err2) => {
            if (err2) {
              next();
            }
          });
        }
      });
    } else {
      next();
    }
  });

  // Vite middleware setup in development, static hosting in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
