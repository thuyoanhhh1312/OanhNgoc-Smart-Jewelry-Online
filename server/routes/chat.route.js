import express from "express";
import axios from "axios";
import { randomUUID } from "crypto";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { sessionId: incomingSessionId, userId = null, message } = req.body || {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        reply: "Anh/chị vui lòng nhập nội dung để em hỗ trợ ạ 💬",
        intent: "VALIDATION_ERROR",
      });
    }

    const sessionId = incomingSessionId || randomUUID();

    if (!process.env.CHATBOT_N8N_WEBHOOK_URL) {
      console.error("CHATBOT_N8N_WEBHOOK_URL is not set in environment variables.");
      return res.status(500).json({
        sessionId,
        reply:
          "Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
        intent: "ERROR",
        orderStatus: "error",
      });
    }

    try {
      const { data } = await axios.post(process.env.CHATBOT_N8N_WEBHOOK_URL, {
        sessionId,
        userId: userId || null,
        message,
      });

      return res.status(200).json({
        sessionId,
        reply: data?.reply,
        intent: data?.intent || null,
        orderStatus: data?.orderStatus ?? null,
      });
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.message || "Unknown error calling n8n webhook";
      console.error("Error calling n8n webhook:", { status, message: msg });
      return res.status(500).json({
        sessionId,
        reply:
          "Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
        intent: "ERROR",
        orderStatus: "error",
      });
    }
  } catch (err) {
    console.error("Unexpected chatbot error:", err);
    return res.status(500).json({
      sessionId: null,
      reply:
        "Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
      intent: "ERROR",
      orderStatus: "error",
    });
  }
});

export default router;
