import express from "express";
import db from "../models/index.js";
import { Op } from "sequelize";
import mysql from "mysql2/promise";
import cheerio from "cheerio";

const router = express.Router();
export const lastProductAdviceBySession = new Map();

// Reuse a lightweight MySQL pool for quick product lookup (SKU/text search)
const productDetailPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "oanhngoc",
  waitForConnections: true,
  connectionLimit: 10,
});

function formatProductDescription(html) {
  if (!html) return "";
  const $ = cheerio.load(html);
  const lines = [];
  $("li").each((_, li) => {
    const $li = $(li);
    const strongText = $li.find("strong").first().text().trim().replace(/:$/, "");
    const cloned = $li.clone();
    cloned.find("strong").remove();
    const valueText = cloned.text().trim();
    if (strongText) {
      lines.push(`• ${strongText}: ${valueText}`);
    } else if (valueText) {
      lines.push(`• ${valueText}`);
    }
  });
  return lines.join("\n");
}

function formatCurrencyVND(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "";
  return amount.toLocaleString("vi-VN") + "₫";
}

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

// Map keyword category -> category_id list (theo bảng category thực tế)
// 1: Bông tai, 2: Mặt dây chuyền, 3: Lắc/Vòng tay, 4: Dây chuyền, 5: Nhẫn, 6: Charm, 7: Dây cổ
const CATEGORY_MAP = {
  ring: [5],
  bracelet: [3],
  necklace: [4, 2], // dây chuyền, mặt dây chuyền
  earring: [1],
};

const CATEGORY_REPLY_PREFIX = {
  ring: "Em gợi ý cho anh/chị một vài mẫu nhẫn đang được khách chọn nhiều:\n",
  bracelet: "Em gợi ý cho anh/chị một vài mẫu vòng tay đang hot:\n",
  necklace: "Em gợi ý vài mẫu dây chuyền xinh cho anh/chị nè:\n",
  earring: "Em gợi ý vài mẫu bông tai dễ phối cho anh/chị:\n",
};

const CATEGORY_KEYWORDS = {
  ring: ["nhẫn", "nhan", "ring"],
  bracelet: ["vòng tay", "lắc tay", "bracelet"],
  necklace: ["dây chuyền", "vòng cổ", "mặt dây chuyền", "necklace"],
  earring: ["bông tai", "hoa tai", "earring"],
};

async function findProductsByCategoryOrName(categoryIds, categoryKey) {
  // Ưu tiên tìm theo category_id; nếu rỗng, fallback tìm theo từ khóa trong tên
  const baseQuery = {
    order: [["sold_quantity", "DESC"]],
    limit: 3,
    attributes: [
      ["product_id", "product_id"],
      ["product_name", "product_name"],
      "price",
      "slug",
      "category_id",
    ],
  };

  const ids = Array.isArray(categoryIds)
    ? categoryIds.filter(Boolean)
    : categoryIds
    ? [categoryIds]
    : [];

  for (const cid of ids) {
    const rows = await db.Product.findAll({
      ...baseQuery,
      where: { category_id: cid },
    });
    if (rows && rows.length) return rows;
  }

  const keywords = CATEGORY_KEYWORDS[categoryKey] || [];
  if (keywords.length === 0) return [];

  const orConditions = keywords.map((kw) => ({
    product_name: { [Op.like]: `%${kw}%` },
  }));

  const fallbackRows = await db.Product.findAll({
    ...baseQuery,
    where: { [Op.or]: orConditions },
  });

  return fallbackRows || [];
}

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

    const productRows = await findProductsByCategoryOrName(
      categoryId,
      category
    );

    if (!productRows || productRows.length === 0) {
      return res.status(200).json({
        reply:
          "Hiện tại em chưa có sản phẩm phù hợp trong danh mục này. Anh/chị có thể thử loại trang sức khác giúp em được không ạ? 🥺",
        products: [],
      });
    }

    const productSummaries = productRows.map((p) => ({
      id: p.product_id || p.id,
      name: p.product_name || p.name,
      slug: p.slug,
      minPrice: Number(p.price),
      maxPrice: Number(p.price),
    }));

    const prefix = CATEGORY_REPLY_PREFIX[category] || "Em gợi ý một vài mẫu cho anh/chị:\n";
    const lines = productSummaries.map((p, idx) => {
      const priceFormatted = Number(p.minPrice).toLocaleString("vi-VN");
      const displayName = p.name || `Mẫu số ${idx + 1}`;
      return `${idx + 1}. ${displayName} – khoảng ${priceFormatted}₫`;
    });

    const reply =
      prefix +
      lines.join("\n") +
      "\nAnh/chị thích mẫu nào em gửi link chi tiết cho mình nha 💎";

    // Lưu cache cho bước lấy link (chỉ giữ field cần thiết)
    lastProductAdviceBySession.set(
      sessionId || "default-session",
      productSummaries
    );

    return res.status(200).json({
      reply,
      products: productSummaries,
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

router.post("/product-link", async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};

    if (!sessionId || !message || typeof message !== "string") {
      return res.status(400).json({
        sessionId: sessionId || null,
        reply:
          "Thiếu sessionId hoặc message, anh/chị chat lại giúp em 1 câu đầy đủ nha 💎",
        intent: "PRODUCT_LINK",
        productUrl: null,
        productId: null,
      });
    }

    const matched = message.toLowerCase().match(/\d+/);
    const chosenIndex = matched ? parseInt(matched[0], 10) : NaN;

    if (isNaN(chosenIndex)) {
      return res.status(200).json({
        sessionId,
        reply:
          'Em chưa rõ anh/chị muốn xem mẫu số mấy. Anh/chị nhắn giúp em số thứ tự, ví dụ: "1", "2" hoặc "3" nha 🥰',
        intent: "PRODUCT_LINK",
        productUrl: null,
        productId: null,
      });
    }

    const products = lastProductAdviceBySession.get(sessionId);

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(200).json({
        sessionId,
        reply:
          'Hiện em chưa tìm thấy danh sách mẫu vừa gợi ý cho anh/chị. Anh/chị thử nhắn lại: "gợi ý vài mẫu nhẫn" để em gửi lại từ đầu nhé 💎',
        intent: "PRODUCT_LINK",
        productUrl: null,
        productId: null,
      });
    }

    const idx = chosenIndex - 1;
    if (idx < 0 || idx >= products.length) {
      return res.status(200).json({
        sessionId,
        reply: `Danh sách em gợi ý chỉ có ${products.length} mẫu thôi ạ. Anh/chị giúp em chọn số từ 1 đến ${products.length} nha 💎`,
        intent: "PRODUCT_LINK",
        productUrl: null,
        productId: null,
      });
    }

    const product = products[idx];
    const frontendBase = (
      process.env.FRONTEND_BASE_URL || "http://oanhngocjewelry.online"
    ).replace(/\/$/, "");
    const slugOrId = product.slug || product.id;
    const productUrl = `${frontendBase}/${slugOrId}`;
    const productName = product.name || `mẫu số ${chosenIndex}`;

    return res.status(200).json({
      sessionId,
      reply: `Đây là link chi tiết mẫu số ${chosenIndex}: ${productName}\n${productUrl}`,
      intent: "PRODUCT_LINK",
      productUrl,
      productId: product.id ?? null,
    });
  } catch (error) {
    console.error("Chatbot product-link error:", error);
    return res.status(200).json({
      sessionId: null,
      reply:
        "Hiện hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
      intent: "PRODUCT_LINK",
      productUrl: null,
      productId: null,
    });
  }
});

// POST /api/chatbot/product-detail
router.post("/product-detail", async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};

    if (!sessionId || !message || typeof message !== "string") {
      return res.status(400).json({
        sessionId: sessionId || null,
        reply:
          "Thiếu sessionId hoặc message, anh/chị nhắn lại giúp em mã hoặc tên sản phẩm nha 💎",
        intent: "PRODUCT_DETAIL_ERROR",
        product: null,
      });
    }

    // Thử tìm chuỗi ký tự/sku trong message (VD: XMXMK000167)
    const skuMatch = message.match(/[A-Za-z0-9_-]{4,}/);
    const searchTerm = skuMatch ? skuMatch[0] : message.trim();

    // Tìm sản phẩm theo SKU/tên/slug
    const [productRows] = await productDetailPool.query(
      `
        SELECT product_id, product_name, price, description, slug
        FROM product
        WHERE product_name LIKE ? OR slug LIKE ? OR product_id = ?
        ORDER BY product_id DESC
        LIMIT 1
      `,
      [`%${searchTerm}%`, `%${searchTerm}%`, Number.isNaN(Number(searchTerm)) ? 0 : Number(searchTerm)]
    );

    const product = productRows?.[0];

    if (!product) {
      return res.status(200).json({
        sessionId,
        reply:
          "Em chưa xác định được sản phẩm anh/chị hỏi. Anh/chị giúp em gửi lại tên hoặc mã sản phẩm đầy đủ nha 💎",
        intent: "PRODUCT_DETAIL",
        product: null,
      });
    }

    // Lấy thống kê review
    const [reviewRows] = await productDetailPool.query(
      `
        SELECT 
          AVG(rating) AS averageRating,
          COUNT(*) AS totalReviews,
          SUM(CASE WHEN sentiment = 'POS' THEN 1 ELSE 0 END) AS positiveReviews
        FROM product_review
        WHERE product_id = ?
      `,
      [product.product_id]
    );

    const reviewStats = reviewRows?.[0] || {};
    const averageRating = Number(reviewStats.averageRating || 0).toFixed(1);
    const totalReviews = Number(reviewStats.totalReviews || 0);
    const positiveReviews = Number(reviewStats.positiveReviews || 0);

    const priceFormatted = formatCurrencyVND(Number(product.price));
    const productName = product.product_name || searchTerm;
    const descriptionText = formatProductDescription(product.description);

    const replyLines = [`Mẫu ${productName} có giá khoảng ${priceFormatted}.`];

    if (descriptionText) {
      replyLines.push(`Các thông tin chính:\n${descriptionText}`);
    }

    if (totalReviews > 0) {
      let ratingLine = `Đánh giá: ${averageRating}/5 từ ${totalReviews} lượt`;
      if (positiveReviews > 0) {
        ratingLine += `, trong đó khoảng ${positiveReviews} đánh giá tích cực.`;
      } else {
        ratingLine += ".";
      }
      replyLines.push(ratingLine);
    }

    replyLines.push("Anh/chị cần em gửi link chi tiết sản phẩm không ạ? 💎");

    const reply = replyLines.join("\n");

    return res.status(200).json({
      sessionId,
      reply,
      intent: "PRODUCT_DETAIL",
      product: {
        id: product.product_id,
        name: productName,
        price: Number(product.price),
        description: product.description,
        slug: product.slug,
        averageRating: Number(averageRating),
        totalReviews,
        positiveReviews,
      },
    });
  } catch (error) {
    console.error("Chatbot product-detail error:", error);
    return res.status(500).json({
      sessionId: req?.body?.sessionId || null,
      reply:
        "Hiện tại hệ thống đang bận, anh/chị thử lại giúp em sau ít phút nha 🥺",
      intent: "ERROR",
      product: null,
    });
  }
});

export default router;
