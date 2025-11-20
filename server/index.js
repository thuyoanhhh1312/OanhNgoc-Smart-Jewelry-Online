// server.js hoặc index.js
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js"; // Đảm bảo file này cũng dùng export default nếu là ES Module
import { errorHandler } from "./middlewares/errorHandler.js";
import vnpayRouter from "./vnpay/payment.js";
import goldPriceRoutes from "./routes/goldPriceRoutes.js";

// Import Cron Jobs
import birthdayEmailJob from "./jobs/birthdayEmailJob.js";
import campaignSegmentEmailJob from "./jobs/campaignSegmentEmailJob.js";
import monthlyRankUpdateJob from "./jobs/monthlyRankUpdateJob.js";
import { startGoldPriceCronJob } from "./jobs/goldPriceCronJob.js";

const app = express();

app.use(express.json());

// Logging middleware để debug
app.use((req, res, next) => {
  console.log(`\n=== Incoming Request ===`);
  console.log(`${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Origin:`, req.get("Origin") || "No Origin");
  console.log(`========================\n`);
  next();
});

const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true, // Allow credentials
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type,Authorization,authtoken",
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Additional CORS headers for Flutter web
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, authtoken"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Gold Prices routes
app.use("/api/gold-prices", goldPriceRoutes);
// VNPay routes
app.use("/api/payment", vnpayRouter);
app.use("/api", apiRoutes);

// middleware xử lý lỗi toàn cục
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, async () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
  console.log(`Server cũng có thể truy cập qua http://127.0.0.1:${port}`);

  // Initialize Cron Jobs
  console.log("\n🤖 ===== INITIALIZING CRON JOBS =====");
  birthdayEmailJob();
  campaignSegmentEmailJob();
  monthlyRankUpdateJob();
  startGoldPriceCronJob(); // 💰 Cron job giá vàng
  console.log("✅ All cron jobs initialized successfully!\n");
});

export default app;
