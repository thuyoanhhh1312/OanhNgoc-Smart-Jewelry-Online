import express from 'express';
import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const router = express.Router();

router.post('/create_payment_url', (req, res) => {
  const ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

  const { orderId, amount } = req.body;

  const tmnCode = process.env.VNP_TMN_CODE; // ✅ phải trùng tên trong .env
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL; // 👈 callback về server


  const createDate = moment().format('YYYYMMDDHHmmss');
  const orderInfo = `Thanh toan don hang ${orderId}`;
  const orderType = 'other';
  const locale = 'vn';
  const currCode = 'VND';

  // ✅ vnp_TxnRef: phải duy nhất cho mỗi lần thanh toán
  const txnRef = orderId.toString();
let vnp_Params = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: tmnCode,
  vnp_Locale: 'vn',
  vnp_CurrCode: 'VND',
  vnp_TxnRef: orderId.toString(),            // mã duy nhất cho đơn
  vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
  vnp_OrderType: 'other',
  vnp_Amount: amount * 100,
  vnp_ReturnUrl: returnUrl,
  vnp_IpAddr: (req.ip || '127.0.0.1'),       // tránh ::1
  vnp_CreateDate: createDate,
};

// ✅ BẮT BUỘC: sort + encode value theo VNPay (space => '+')
const sortedEncoded = {};
Object.keys(vnp_Params).sort().forEach((k) => {
  sortedEncoded[k] = encodeURIComponent(vnp_Params[k]).replace(/%20/g, '+');
});

// ✅ Ký trên chuỗi đã ENCODE theo quy tắc trên
const signData = qs.stringify(sortedEncoded, { encode: false });
const signed = crypto.createHmac('sha512', secretKey)
  .update(Buffer.from(signData, 'utf-8'))
  .digest('hex');

sortedEncoded.vnp_SecureHash = signed;

// ✅ Build URL cũng dùng encode=false (vì value đã encode sẵn)
const paymentUrl = `${vnpUrl}?${qs.stringify(sortedEncoded, { encode: false })}`;

console.log('✅ VNPay URL:', paymentUrl);
return res.status(200).json({ paymentUrl });
});

// ⚠️ tạo kết nối DB (nếu bạn chưa có)
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
router.get('/vnpay_return', async (req, res) => {
  console.log('🔥 Callback VNPay nhận được:', req.query);

  const vnp_Params = req.query;
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = crypto
    .createHmac('sha512', process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  if (vnp_Params.vnp_ResponseCode === '00') {
  const orderId = vnp_Params.vnp_TxnRef;
  const transactionNo = vnp_Params.vnp_TransactionNo || 'TEST_' + orderId;
  const amount = parseInt(vnp_Params.vnp_Amount) / 100;

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await db.execute(
    `UPDATE orders 
     SET deposit_status = 'paid', payment_method = 'vnpay', updated_at = NOW() 
     WHERE order_id = ?`,
    [orderId]
  );

  // ✅ Lưu log thanh toán vào bảng payment_logs
await db.execute(
  `INSERT INTO payment_logs (order_code, gateway, kind, payload, verified)
   VALUES (?, 'VNPAY', 'pay', ?, ?)`,
  [orderId, JSON.stringify(vnp_Params), 1]
);


  console.log(`✅ Đơn hàng ${orderId} đã thanh toán thành công!`);
  return res.redirect(`http://localhost:3000/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${orderId}`);
}


  console.log('❌ Giao dịch thất bại hoặc sai checksum');
  return res.redirect(`http://localhost:3000/payment-fail`);
});

export default router;