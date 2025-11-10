// server.js hoặc index.js
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js'; // Đảm bảo file này cũng dùng export default nếu là ES Module
import { errorHandler } from './middlewares/errorHandler.js';
import vnpayRouter from './vnpay/payment.js';

const app = express();

app.use(express.json());

const corsOptions = {
  origin: ['http://localhost:3000', 'http://oanhngocjewelry.online'],
  methods: 'GET,POST,PUT,DELETE,PATCH',
  allowedHeaders: 'Content-Type,Authorization,authtoken',
};

app.use(cors(corsOptions));

app.use("/api", apiRoutes);
// VNPay routes
app.use('/api/payment', vnpayRouter);  

// middleware xử lý lỗi toàn cục
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});

export default app;