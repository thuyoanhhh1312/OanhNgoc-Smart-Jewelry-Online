import express from "express";
import moment from "moment";
import qs from "qs";
import crypto from "crypto";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
dotenv.config();

const router = express.Router();

router.post("/create_payment_url", (req, res) => {
  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

  const { orderId, amount } = req.body;

  const tmnCode = process.env.VNP_TMN_CODE; // ✅ phải trùng tên trong .env
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL;
  const createDate = moment().format("YYYYMMDDHHmmss");
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const orderType = "other";
  const locale = "vn";
  const currCode = "VND";

  // ✅ vnp_TxnRef: phải duy nhất cho mỗi lần thanh toán
  const txnRef = orderId.toString();
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.toString(), // mã duy nhất cho đơn
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: req.ip || "127.0.0.1", // tránh ::1
    vnp_CreateDate: createDate,
  };

  // ✅ BẮT BUỘC: sort + encode value theo VNPay (space => '+')
  const sortedEncoded = {};
  Object.keys(vnp_Params)
    .sort()
    .forEach((k) => {
      sortedEncoded[k] = encodeURIComponent(vnp_Params[k]).replace(/%20/g, "+");
    });

  // ✅ Ký trên chuỗi đã ENCODE theo quy tắc trên
  const signData = qs.stringify(sortedEncoded, { encode: false });
  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  sortedEncoded.vnp_SecureHash = signed;

  // ✅ Build URL cũng dùng encode=false (vì value đã encode sẵn)
  const paymentUrl = `${vnpUrl}?${qs.stringify(sortedEncoded, {
    encode: false,
  })}`;

  console.log("✅ VNPay URL:", paymentUrl);
  return res.status(200).json({ paymentUrl });
});

router.get("/vnpay_return", async (req, res) => {
  console.log("🔥 Callback VNPay nhận được:", req.query);

  const vnp_Params = req.query;
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  // ✅ VERIFY SIGNATURE - Phải SORT + ENCODE theo VNPay rules
  const sortedEncoded = {};
  Object.keys(vnp_Params)
    .sort()
    .forEach((k) => {
      sortedEncoded[k] = encodeURIComponent(vnp_Params[k]).replace(/%20/g, "+");
    });

  const signData = qs.stringify(sortedEncoded, { encode: false });
  console.log("📝 Sign data:", signData);
  console.log("🔑 Secret key:", process.env.VNP_HASHSECRET);

  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  console.log("✍️ Computed hash:", signed);
  console.log("📨 Received hash:", secureHash);

  if (signed !== secureHash) {
    console.error("❌ SecureHash không hợp lệ - Callback giả mạo!");
    return res.redirect(
      `${process.env.CLIENT_URL}/order-failed?error=invalid_signature`
    );
  }

  console.log("✅ SecureHash hợp lệ!");

  if (vnp_Params.vnp_ResponseCode === "00") {
    const orderId = vnp_Params.vnp_TxnRef;
    const transactionNo = vnp_Params.vnp_TransactionNo || "TEST_" + orderId;
    const amount = parseInt(vnp_Params.vnp_Amount) / 100;

    let dbConnection = null;
    try {
      dbConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      // Kiểm tra đơn hàng có tồn tại không
      const [checkOrder] = await dbConnection.execute(
        `SELECT order_id, total, status_id FROM orders WHERE order_id = ?`,
        [orderId]
      );

      if (!checkOrder || checkOrder.length === 0) {
        console.error(`❌ Order ${orderId} không tồn tại trong database`);
        await dbConnection.end();
        return res.redirect(
          `${process.env.CLIENT_URL}/order-failed?error=order_not_found`
        );
      }

      const order = checkOrder[0];

      // ✅ Phân biệt VNPay full vs VNPay deposit (COD)
      // - Nếu amount = total → VNPay full → status_id = 2 (confirmed)
      // - Nếu amount = total * 0.1 → VNPay deposit (COD) → chỉ set deposit_status = 'paid'
      const isDeposit = Math.abs(amount - order.total * 0.1) < 1;
      const expectedAmount = isDeposit ? order.total * 0.1 : order.total;
      const newStatusId = isDeposit ? 1 : 2; // Deposit: vẫn 1 (pending), Full: 2 (confirmed)

      console.log(
        `📊 Payment type: ${
          isDeposit ? "DEPOSIT (COD)" : "FULL PAYMENT"
        } | Amount: ${amount} | Expected: ${expectedAmount} | Total: ${
          order.total
        }`
      );

      // ✅ Kiểm tra amount khớp không (tùy theo loại payment)
      if (Math.abs(expectedAmount - amount) > 1) {
        console.error(
          `❌ Amount không khớp: Expected=${expectedAmount}, VNPay=${amount}`
        );
        await dbConnection.end();
        return res.redirect(
          `${process.env.CLIENT_URL}/order-failed?error=amount_mismatch`
        );
      }

      // ✅ Kiểm tra xem đã xác nhận rồi không (status_id = 2 = confirmed)
      if (order.status_id === 2) {
        console.warn(
          `⚠️ Order ${orderId} đã được xác nhận rồi (VNPay duplicate callback)`
        );
        const [orderData] = await dbConnection.execute(
          `SELECT o.order_id, o.customer_id, o.user_id, o.payment_method, o.total, o.sub_total, o.discount, o.shipping_address, o.created_at, o.status_id,
             COALESCE(c.name, u.name) AS customer_name, 
             COALESCE(c.email, u.email) AS email, 
             COALESCE(c.phone, '') AS phone
           FROM orders o
           LEFT JOIN customer c ON o.customer_id = c.customer_id
           LEFT JOIN user u ON o.user_id = u.id
           WHERE o.order_id = ?`,
          [orderId]
        );
        await dbConnection.end();
        const orderResult =
          orderData && orderData[0] ? JSON.stringify(orderData[0]) : null;
        return res.redirect(
          `${
            process.env.CLIENT_URL
          }/order-success?orderId=${orderId}&vnp_ResponseCode=00&orderData=${encodeURIComponent(
            orderResult || ""
          )}`
        );
      }

      // ✅ Update đơn hàng với thông tin thanh toán (phân biệt deposit vs full)
      await dbConnection.execute(
        `UPDATE orders 
       SET deposit_status = 'paid', 
           payment_method = 'vnpay', 
           transaction_id = ?,
           payment_details = ?,
           status_id = ?,
           updated_at = NOW() 
       WHERE order_id = ? AND status_id = 1`,
        [
          vnp_Params.vnp_TransactionNo || orderId,
          JSON.stringify(vnp_Params),
          newStatusId,
          orderId,
        ]
      );

      // ✅ Kiểm tra xem update có thành công không (tránh race condition)
      const [updateResult] = await dbConnection.execute(
        `SELECT ROW_COUNT() as changedRows`
      );
      const changedRows = updateResult[0]?.changedRows || 0;

      if (changedRows === 0) {
        console.warn(
          `⚠️ Order ${orderId} không được cập nhật (có thể đã xác nhận trước đó)`
        );
      } else {
        const logMsg = isDeposit
          ? `✅ Order ${orderId} đã cọc 10% thành công! (VNPay Deposit - COD)`
          : `✅ Order ${orderId} đã thanh toán toàn bộ! (VNPay Full)`;
        console.log(logMsg);
      }

      // ✅ Lấy chi tiết đơn hàng kèm thông tin khách hàng
      const [orderData] = await dbConnection.execute(
        `SELECT o.order_id, o.customer_id, o.user_id, o.payment_method, o.total, o.sub_total, o.discount, o.shipping_address, o.created_at, o.status_id,
           COALESCE(c.name, u.name) AS customer_name, 
           COALESCE(c.email, u.email) AS email, 
           COALESCE(c.phone, '') AS phone
         FROM orders o
         LEFT JOIN customer c ON o.customer_id = c.customer_id
         LEFT JOIN user u ON o.user_id = u.id
         WHERE o.order_id = ?`,
        [orderId]
      );

      await dbConnection.end();

      console.log(`✅ Đơn hàng ${orderId} đã thanh toán thành công!`);

      const orderResult =
        orderData && orderData[0] ? JSON.stringify(orderData[0]) : null;

      // ✅ Redirect về OrderSuccess với order data
      return res.redirect(
        `${
          process.env.CLIENT_URL
        }/order-success?orderId=${orderId}&vnp_ResponseCode=00&orderData=${encodeURIComponent(
          orderResult || ""
        )}`
      );
    } catch (error) {
      console.error("❌ Error in VNPay callback:", error);
      if (dbConnection) await dbConnection.end();
      return res.redirect(
        `${process.env.CLIENT_URL}/order-failed?error=system_error`
      );
    }
  }

  console.log("❌ Giao dịch thất bại hoặc sai checksum");
  return res.redirect(`${process.env.CLIENT_URL}/order-failed`);
});

// ✅ API endpoint để frontend lấy chi tiết đơn hàng
router.get("/order-details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Lấy thông tin đơn hàng + thông tin khách hàng
    const [orders] = await db.execute(
      `SELECT o.order_id, o.customer_id, o.user_id, o.payment_method, o.total, o.sub_total, o.discount, o.shipping_address, o.created_at, o.status_id,
         COALESCE(c.name, u.name) AS customer_name, 
         COALESCE(c.email, u.email) AS email, 
         COALESCE(c.phone, '') AS phone
       FROM orders o
       LEFT JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN user u ON o.user_id = u.id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (!orders || orders.length === 0) {
      await db.end();
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    // Lấy chi tiết sản phẩm trong đơn hàng (không JOIN products, chỉ lấy order_items)
    const [orderItems] = await db.execute(
      `SELECT order_id, product_id, quantity, price, total_price
       FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    await db.end();

    return res.status(200).json({
      order,
      items: orderItems || [],
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
