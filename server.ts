import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

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

  // API endpoint for sending Subscription Email Confirmation
  app.post("/api/send-subscription-email", async (req, res) => {
    try {
      const {
        userEmail,
        userName,
        packageLabel,
        price,
        nextDeliveryDate,
        shippingAddress,
        packageName,
        depositor,
      } = req.body;

      if (!userEmail) {
        return res.status(400).json({
          success: false,
          error: "Recipient email is required.",
        });
      }

      // Check if SMTP is configured
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
      const smtpFromName = process.env.SMTP_FROM_NAME || "PINO공방";
      const smtpFromEmail = process.env.SMTP_FROM_EMAIL || smtpUser || "no-reply@pino.com";

      // Build conditional HTML content to avoid nested template literal issues
      const infoBoxHtml = price > 0 
        ? `
  <div style="background-color: #FFF8F1; border: 1px solid #C79A4A; border-radius: 16px; padding: 15px; margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
    <strong style="color: #4A3E3D; font-size: 13px;">🏦 무통장 정기 입금 계좌 안내</strong><br/>
    농협은행 <b>352-1396-4182-13</b> (예금주: 장정현)<br/>
    매달 1일 정오까지 당월 요금이 입금되어야 10일 정상 출고가 가능합니다. (입금자명: <b>${depositor || shippingAddress?.name || userName}</b>)
  </div>
        ` 
        : `
  <div style="background-color: #EFF6FF; border: 1px solid #3B82F6; border-radius: 16px; padding: 15px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; color: #1E40AF;">
    <strong style="font-size: 13px;">✨ 무료체험단 안내사항</strong><br/>
    신상품 무료체험단 상품은 전액 무료(배송비 포함)로 발송되며, 상품 수령 후 14일 이내 간단한 피드백(카카오톡 또는 한줄평) 작성이 요청됩니다.
  </div>
        `;

      const infoBoxText = price > 0 
        ? `■ 무통장 정기 입금 계좌 안내\n농협은행: 352-1396-4182-13 (예금주: 장정현)\n매달 1일 정오까지 당월 요금이 입금되어야 10일 정상 발송됩니다. (입금자명: ${depositor || shippingAddress?.name || userName})`
        : "■ 무료체험단 안내사항\n체험비 및 배송비는 전액 무료(0원)이며, 수령 후 14일 이내 후기 피드백이 요청됩니다.";

      // Build HTML Template
      const htmlContent = `
<div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #E8D5C4; border-radius: 24px; background-color: #FFF8F1; color: #4A3E3D;">
  <div style="text-align: center; margin-bottom: 20px;">
    <span style="font-size: 11px; font-weight: bold; color: #C79A4A; background-color: #ffffff; padding: 5px 12px; border: 1px solid #E8D5C4; border-radius: 12px; display: inline-block; letter-spacing: 1px;">PINO공방 정기구독</span>
    <h1 style="font-size: 24px; font-weight: 800; margin-top: 15px; color: #4A3E3D;">💌 정기구독 신청이 완료되었습니다!</h1>
    <p style="font-size: 14px; color: #4A3E3D; opacity: 0.8; margin-top: 5px;">매달 문 앞으로 찾아오는 따스한 양모 펠트의 행복을 전해드립니다.</p>
  </div>
  
  <div style="background-color: #ffffff; border: 1px solid #E8D5C4; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 16px; font-weight: bold; margin-top: 0; color: #4A3E3D; border-bottom: 1px solid #E8D5C4; padding-bottom: 10px;">📋 신청 구독 정보</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 6px 0; color: #888888; width: 120px;">선택한 패키지</td>
        <td style="padding: 6px 0; font-weight: bold; color: #4A3E3D;">${packageLabel}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888888;">월 정기 구독료</td>
        <td style="padding: 6px 0; font-weight: bold; color: #C79A4A; font-size: 15px;">${price === 0 ? "0원 (무료 체험단)" : price.toLocaleString() + "원"}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888888;">첫 발송 예정일</td>
        <td style="padding: 6px 0; font-weight: bold; color: #4A3E3D;">${nextDeliveryDate} 예정 (매월 10일 순차 발송)</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #E8D5C4; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 16px; font-weight: bold; margin-top: 0; color: #4A3E3D; border-bottom: 1px solid #E8D5C4; padding-bottom: 10px;">🚚 배송지 정보</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 6px 0; color: #888888; width: 120px;">수령인</td>
        <td style="padding: 6px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.name || userName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888888;">연락처</td>
        <td style="padding: 6px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.phone || "없음"}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888888;">배송 주소</td>
        <td style="padding: 6px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.address || ""} ${shippingAddress?.detailAddress || ""}</td>
      </tr>
    </table>
  </div>

  ${infoBoxHtml}

  <div style="text-align: center; font-size: 11px; color: #888888; margin-top: 30px; border-top: 1px solid #E8D5C4; padding-top: 15px;">
    본 메일은 PINO공방 정기구독 서비스 신청 회원님께 발송되는 확인 메일입니다.<br/>
    문의사항: wjdg7441@naver.com | © 2026 PINO공방. All rights reserved.
  </div>
</div>
`;

      const textContent = `
[PINO공방] 정기구독 신청이 완료되었습니다!

매달 문 앞으로 찾아오는 따스한 양모 펠트의 행복을 전해드립니다.

■ 신청 구독 정보
- 선택한 패키지: ${packageLabel}
- 월 정기 구독료: ${price === 0 ? "0원 (무료 체험단)" : price.toLocaleString() + "원"}
- 첫 발송 예정일: ${nextDeliveryDate} 예정

■ 배송지 정보
- 수령인: ${shippingAddress?.name || userName}
- 연락처: ${shippingAddress?.phone || "없음"}
- 배송 주소: ${shippingAddress?.address || ""} ${shippingAddress?.detailAddress || ""}

${infoBoxText}

문의사항: wjdg7441@naver.com
© 2026 PINO공방. All rights reserved.
`;

      const adminEmail = process.env.ADMIN_EMAIL || "lch200048@gmail.com";

      const adminHtmlContent = `
<div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #C79A4A; border-radius: 24px; background-color: #ffffff; color: #4A3E3D;">
  <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #E8D5C4; padding-bottom: 15px;">
    <span style="font-size: 11px; font-weight: bold; color: #ffffff; background-color: #C79A4A; padding: 5px 12px; border-radius: 12px; display: inline-block; letter-spacing: 1px;">관리자 알림</span>
    <h1 style="font-size: 22px; font-weight: 800; margin-top: 15px; color: #4A3E3D;">🎁 새로운 정기구독 신청 발생!</h1>
    <p style="font-size: 13px; color: #888888; margin-top: 5px;">PINO공방에 새로운 정기구독 회원이 등록되었습니다. 세부 내용을 확인해 주세요.</p>
  </div>
  
  <div style="background-color: #FFF8F1; border: 1px solid #E8D5C4; border-radius: 16px; padding: 20px; margin-bottom: 15px;">
    <h3 style="font-size: 14px; font-weight: bold; margin-top: 0; color: #4A3E3D; border-bottom: 1px solid #E8D5C4; padding-bottom: 8px;">👤 신청인 정보</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 5px 0; color: #888888; width: 120px;">신청자명 (계정)</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${userName} (${userEmail})</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #FFF8F1; border: 1px solid #E8D5C4; border-radius: 16px; padding: 20px; margin-bottom: 15px;">
    <h3 style="font-size: 14px; font-weight: bold; margin-top: 0; color: #4A3E3D; border-bottom: 1px solid #E8D5C4; padding-bottom: 8px;">📋 신청 구독 정보</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 5px 0; color: #888888; width: 120px;">구독 상품</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${packageLabel} (${packageName})</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #888888;">월 결제액</td>
        <td style="padding: 5px 0; font-weight: bold; color: #C79A4A; font-size: 14px;">${price === 0 ? "0원 (무료 체험단)" : price.toLocaleString() + "원"}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #888888;">입금자 지명</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${depositor || "없음(체험단)"}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #888888;">첫 발송일</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${nextDeliveryDate}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #FFF8F1; border: 1px solid #E8D5C4; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 14px; font-weight: bold; margin-top: 0; color: #4A3E3D; border-bottom: 1px solid #E8D5C4; padding-bottom: 8px;">🚚 배송 수령처 정보</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 5px 0; color: #888888; width: 120px;">수령인명</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.name || userName}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #888888;">연락처</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.phone || "없음"}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #888888;">배송 주소</td>
        <td style="padding: 5px 0; font-weight: bold; color: #4A3E3D;">${shippingAddress?.address || ""} ${shippingAddress?.detailAddress || ""}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; font-size: 11px; color: #888888; margin-top: 30px; border-top: 1px solid #E8D5C4; padding-top: 15px;">
    본 알림은 PINO공방 정기구독 신청 시 자동 발송되는 어드민 알림 메일입니다.<br/>
    관리자 콘솔에서 배송 및 주문 세부 이력을 관리하실 수 있습니다.
  </div>
</div>
`;

      const adminTextContent = `
[PINO공방 - 관리자 알림] 새로운 정기구독 신청이 등록되었습니다!

■ 가입 회원 정보
- 신청인 성함: ${userName}
- 계정 이메일: ${userEmail}

■ 신청 구독 정보
- 선택 패키지: ${packageLabel} (${packageName})
- 월 구독 요금: ${price === 0 ? "0원 (무료 체험단)" : price.toLocaleString() + "원"}
- 첫 배송 예정일: ${nextDeliveryDate}
- 입금 예정자명: ${depositor || "체험단/없음"}

■ 배송지 상세 정보
- 수령인: ${shippingAddress?.name || userName}
- 연락처: ${shippingAddress?.phone || "없음"}
- 주소지: ${shippingAddress?.address || ""} ${shippingAddress?.detailAddress || ""}

관리자 콘솔에서 해당 구독 상태 및 입금 이력을 확인하시고 출고 준비를 활성화해 주세요.
`;

      // Log to terminal for debugging and validation
      console.log(`\n======================================================\n📧 [EMAIL DISPATCH SIMULATED / QUEUED]\nTo: ${userEmail}\nSubject: [PINO공방] ${packageLabel} 정기구독 신청 완료 안내\n------------------------------------------------------\n${textContent}\n======================================================\n`);
      console.log(`\n======================================================\n📧 [ADMIN EMAIL DISPATCH SIMULATED / QUEUED]\nTo: ${adminEmail}\nSubject: [PINO공방 - 관리자 알림] 새로운 정기구독 신청 알림\n------------------------------------------------------\n${adminTextContent}\n======================================================\n`);

      if (!smtpUser || !smtpPass) {
        console.warn(
          "⚠️ Email Sending Fallback: SMTP_USER or SMTP_PASS is not defined in environment variables. Emails logged to console."
        );
        return res.status(200).json({
          success: true,
          simulated: true,
          message: "Emails simulated successfully. Configure SMTP in environment to send real emails to subscriber & admin.",
        });
      }

      // Real sending
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Send to User
      await transporter.sendMail({
        from: `"${smtpFromName}" <${smtpFromEmail}>`,
        to: userEmail,
        subject: `[PINO공방] ${packageLabel} 정기구독 신청 완료 안내 🧸`,
        text: textContent,
        html: htmlContent,
      });

      // Send to Admin
      await transporter.sendMail({
        from: `"${smtpFromName}" <${smtpFromEmail}>`,
        to: adminEmail,
        subject: `[PINO공방 - 관리자 알림] 새로운 정기구독 신청 알림 🎁`,
        text: adminTextContent,
        html: adminHtmlContent,
      });

      console.log(`✅ Real emails successfully sent to user (${userEmail}) and admin (${adminEmail})!`);
      return res.status(200).json({ success: true, simulated: false });

    } catch (error) {
      console.error("❌ Error sending subscription email:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // Support serving SEO assets and search engine verification files (like sitemap.xml, robots.txt, naver/google verification HTML/XML)
  // directly from the project root or public folder in both development and production.
  app.get("/:filename", (req, res, next) => {
    const filename = req.params.filename;
    if (filename.endsWith(".xml") || filename.endsWith(".txt") || filename.endsWith(".html") || filename === "og-image.jpg") {
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
