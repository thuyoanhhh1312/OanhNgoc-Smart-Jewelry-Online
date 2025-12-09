import express from "express";
import db from "../models/index.js";
import { Op } from "sequelize";

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

// Detect category from Vietnamese message
function detectCategoryFromMessage(message) {
  const lower = message.toLowerCase();
  if (lower.includes("nhẫn")) return "ring";
  if (lower.includes("vòng tay") || lower.includes("lắc tay")) return "bracelet";
  if (lower.includes("dây chuyền") || lower.includes("vòng cổ")) return "necklace";
  if (lower.includes("bông tai") || lower.includes("hoa tai")) return "earring";
  return null;
}

const CATEGORY_MAP = {
  ring: 1,
  bracelet: 2,
  necklace: 3,
  earring: 4,
};

const CATEGORY_REPLY_PREFIX = {
  ring: "Em gợi ý cho anh/chị một vài mẫu nhẫn đang được khách chọn nhiều:\n",
  bracelet: "Em gợi ý cho anh/chị một vài mẫu vòng tay đang hot:\n",
  necklace: "Em gợi ý vài mẫu dây chuyền xinh cho anh/chị nè:\n",
  earring: "Em gợi ý vài mẫu bông tai dễ phối cho anh/chị:\n",
};

router.post("/product-advice", async (req, res) => {
  try {
    const { sessionId, userId, message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({
        reply:
          "Anh/chị mô tả giúp em loại trang sức muốn tìm (nhẫn, vòng tay, dây chuyền...) để em tư vấn chính xác hơn ạ ✨",
        products: [],
      });
    }

    const category = detectCategoryFromMessage(message);
    if (!category) {
      return res.status(200).json({
        reply:
          "Anh/chị muốn tìm nhẫn, dây chuyền, vòng tay hay bông tai ạ? Em sẽ gợi ý mẫu phù hợp cho mình 🤍",
        products: [],
      });
    }

    const categoryId = CATEGORY_MAP[category];
    if (!categoryId) {
      return res.status(200).json({
        reply:
          "Hiện tại em chưa có sản phẩm phù hợp trong danh mục này. Anh/chị có thể thử loại trang sức khác giúp em được không ạ? 🥺",
        products: [],
      });
    }

    const products = await db.Product.findAll({
      where: { category_id: categoryId },
      order: [["sold_quantity", "DESC"]],
      limit: 3,
      attributes: [
        ["product_id", "product_id"],
        ["product_name", "product_name"],
        "price",
        "slug",
      ],
    });

    if (!products || products.length === 0) {
      return res.status(200).json({
        reply:
          "Hiện tại em chưa có sản phẩm phù hợp trong danh mục này. Anh/chị có thể thử loại trang sức khác giúp em được không ạ? 🥺",
        products: [],
      });
    }

    const prefix = CATEGORY_REPLY_PREFIX[category] || "Em gợi ý một vài mẫu cho anh/chị:\n";
    const lines = products.map((p, idx) => {
      const priceFormatted = Number(p.price).toLocaleString("vi-VN");
      const displayName = p.product_name || p.name;
      return `${idx + 1}. ${displayName} – khoảng ${priceFormatted}₫`;
    });

    const reply =
      prefix +
      lines.join("\n") +
      "\nAnh/chị thích mẫu nào em gửi link chi tiết cho mình nha 💎";

    return res.status(200).json({
      reply,
      products: products.map((p) => ({
        id: p.product_id || p.id,
        name: p.product_name || p.name,
        price: Number(p.price),
        slug: p.slug,
      })),
    });
  } catch (error) {
    console.error("Chatbot product-advice error:", error);
    return res.status(200).json({
      reply:
        "Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
      products: [],
    });
  }
});

export default router;
