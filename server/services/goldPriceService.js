import puppeteer from "puppeteer";
import db from "../models/index.js";

const { GoldPrice } = db;

/**
 * Kéo giá vàng thực tế từ PNJ.com.vn dùng Puppeteer
 * Vì PNJ dùng JavaScript render động
 */
export const fetchAndSaveGoldPrices = async (location = "TP.HCM") => {
  let browser;
  try {
    console.log(`📊 Kéo giá vàng PNJ (${location}) - Dữ liệu thực tế...`);

    // Khởi tạo browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("https://pnj.com.vn/site/gia-vang", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Chờ bảng giá load
    await page
      .waitForSelector("[class*='price'], [class*='gold'], table", {
        timeout: 10000,
      })
      .catch(() => console.log("⚠️ Selector không tìm thấy, thử tiếp tục..."));

    // Extract dữ liệu từ page
    const goldPrices = await page.evaluate(() => {
      const prices = [];

      // Thử tìm theo bảng
      const rows = document.querySelectorAll(
        "table tr, .price-row, [class*='gold-item']"
      );

      if (rows.length > 0) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll(
            "td, .price-cell, [class*='cell']"
          );
          if (cells.length >= 3) {
            const goldType = cells[0]?.textContent?.trim();
            const buyPrice = parseInt(
              cells[1]?.textContent?.replace(/\D/g, "")
            );
            const sellPrice = parseInt(
              cells[2]?.textContent?.replace(/\D/g, "")
            );

            if (goldType && buyPrice && sellPrice) {
              // Parse purity từ tên
              const purityMatch = goldType.match(/(\d+\.?\d*)/);
              const purity = purityMatch ? purityMatch[1] : "999.9";

              prices.push({
                gold_type: goldType,
                purity,
                buy_price: buyPrice,
                sell_price: sellPrice,
              });
            }
          }
        });
      }

      // Nếu không tìm thấy, thử tìm text chứa giá
      if (prices.length === 0) {
        const allText = document.body.innerText;
        console.log("Page text sample:", allText.substring(0, 500));
      }

      return prices;
    });

    if (goldPrices.length === 0) {
      console.warn(
        "⚠️ Không lấy được giá vàng từ PNJ (trang có thể thay đổi cấu trúc)"
      );
      // Fallback: Lấy từ text content
      const fallbackPrices = await extractFromPageText(page, location);
      if (fallbackPrices.length > 0) {
        const saved = await savePrices(fallbackPrices, location);
        return saved;
      }
      return [];
    }

    // Gán location và source
    const enrichedPrices = goldPrices.map((p) => ({
      ...p,
      location,
      source: "PNJ",
    }));

    const saved = await savePrices(enrichedPrices, location);
    return saved;
  } catch (error) {
    console.error("❌ Lỗi kéo giá vàng:", error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Fallback: Extract từ text content
 */
async function extractFromPageText(page, location) {
  try {
    const pageText = await page.evaluate(() => document.body.innerText);

    // Pattern: "Vàng 999 ... 68.500 ... 70.000"
    const lines = pageText.split("\n");
    const prices = [];

    for (let i = 0; i < lines.length - 2; i++) {
      const line = lines[i].trim();
      if (
        line.includes("Vàng") ||
        line.includes("vàng") ||
        line.includes("Nhẫn")
      ) {
        const buyLine = lines[i + 1]?.replace(/\D/g, "");
        const sellLine = lines[i + 2]?.replace(/\D/g, "");

        if (buyLine && sellLine) {
          prices.push({
            gold_type: line,
            purity: "999",
            buy_price: parseInt(buyLine),
            sell_price: parseInt(sellLine),
            location,
            source: "PNJ",
          });
        }
      }
    }

    return prices;
  } catch (error) {
    console.error("❌ Lỗi extract text:", error.message);
    return [];
  }
}

/**
 * Lưu giá vàng vào DB
 */
async function savePrices(goldPrices, location) {
  try {
    // Xóa giá cũ
    await GoldPrice.destroy({
      where: { location, source: "PNJ" },
    });

    // Lưu giá mới
    const saved = await GoldPrice.bulkCreate(goldPrices);
    console.log(`✅ Đã lưu ${saved.length} loại vàng cho ${location}`);

    return saved;
  } catch (error) {
    console.error("❌ Lỗi lưu giá:", error.message);
    return [];
  }
}

/**
 * Hoặc: Input giá vàng thủ công (Admin cập nhật)
 */
export const updateGoldPrice = async (goldPriceData) => {
  try {
    const {
      gold_price_id,
      gold_type,
      purity,
      buy_price,
      sell_price,
      location,
    } = goldPriceData;

    if (gold_price_id) {
      // Update
      const updated = await GoldPrice.update(
        { gold_type, purity, buy_price, sell_price, location },
        { where: { gold_price_id } }
      );
      return updated;
    } else {
      // Create
      const created = await GoldPrice.create({
        gold_type,
        purity,
        buy_price,
        sell_price,
        location: location || "TP.HCM",
        source: "Admin",
      });
      return created;
    }
  } catch (error) {
    console.error("❌ Lỗi cập nhật giá vàng:", error.message);
    throw error;
  }
};
