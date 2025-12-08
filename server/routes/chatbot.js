import express from "express";
import db from "../models/index.js";

const router = express.Router();

const ORDER_STATUS_NORMALIZED = {
  cho_xu_ly: "pending",
  da_xac_nhan: "confirmed",
  dang_giao: "shipping",
  hoan_tat: "completed",
  da_huy: "cancelled",
  // Bổ sung thêm các mã đang dùng trong bảng order_status
  dang_xu_ly: "confirmed",
  dang_van_chuyen: "shipping",
  da_giao: "completed",
};

const ORDER_STATUS_LABEL_VN = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const ORDER_STATUS_ID_NORMALIZED = {
  1: "pending",
  2: "confirmed",
  3: "shipping",
  4: "completed",
  5: "cancelled",
};

function formatDateVN(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

router.post("/check-order", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.json({
        reply:
          "Em chưa nhận được nội dung anh/chị hỏi. Anh/chị nhắn lại giúp em với ạ 🥺",
        orderStatus: null,
      });
    }

    const match = message.match(/\d+/);
    if (!match) {
      return res.json({
        reply:
          "Anh/chị cho em xin mã đơn hàng (ví dụ: 123456) để em kiểm tra giúp mình ạ 💛",
        orderStatus: null,
      });
    }

    const orderCode = match[0];

    const whereClause = {};
    if (db.Order?.rawAttributes?.order_code) {
      whereClause.order_code = orderCode;
    } else if (db.Order?.rawAttributes?.orderCode) {
      whereClause.orderCode = orderCode;
    } else {
      whereClause.order_id = orderCode;
    }

    const order = await db.Order.findOne({
      where: whereClause,
      include: [
        {
          model: db.OrderStatus,
          attributes: ["status_code", "status_name"],
        },
      ],
    });

    if (!order) {
      return res.json({
        reply: `Dạ em chưa tìm thấy đơn hàng *${orderCode}* trong hệ thống. Anh/chị kiểm tra lại mã đơn hoặc số điện thoại giúp em với ạ 🥺`,
        orderStatus: "not_found",
      });
    }

    const statusCode =
      order.status ||
      order.status_code ||
      order?.OrderStatus?.status_code ||
      null;
    const statusId =
      order.status_id || order.statusId || order?.OrderStatus?.status_id || null;

    const normalizedStatus =
      ORDER_STATUS_NORMALIZED[statusCode] ||
      ORDER_STATUS_ID_NORMALIZED[statusId] ||
      null;

    const vnStatus =
      (normalizedStatus && ORDER_STATUS_LABEL_VN[normalizedStatus]) ||
      order?.OrderStatus?.status_name ||
      "Đang xử lý";

    const createdAt = order.createdAt || order.created_at;
    const createdAtFormatted = createdAt
      ? formatDateVN(createdAt)
      : "Không xác định";

    const reply = `Đơn hàng *${orderCode}* của anh/chị hiện đang: **${vnStatus}**.\nNgày đặt: ${createdAtFormatted}.\nNếu anh/chị cần hỗ trợ đổi địa chỉ hoặc thời gian nhận hàng, cứ nhắn em nha 💎`;

    return res.json({
      reply,
      orderStatus: normalizedStatus || "unknown",
    });
  } catch (error) {
    console.error("Chatbot check-order error:", error);
    return res.json({
      reply:
        "Hệ thống bên em đang bận, anh/chị cho em xin ít phút rồi thử lại giúp em nhé 😢",
      orderStatus: "error",
    });
  }
});

export default router;
