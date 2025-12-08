// routes/apiRoutes.js
import express from "express";
import {
  getSimilarProducts,
  filterProducts,
} from "../controllers/productController.js";

const router = express.Router();

// Middleware
import {
  isAdmin,
  authenticateToken,
  isAdminOrStaff,
} from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import * as articleController from "../controllers/articleController.js";
import {
  createArticleSchema,
  updateArticleSchema,
} from "../validators/articleValidator.js";

//validators
import {
  calculatePriceSchema,
  checkoutSchema,
} from "../validators/orderValidator.js";

import upload from "../middlewares/upload.js";

// Controllers
import * as roleController from "../controllers/roleController.js";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/authController.js";
import * as categoryController from "../controllers/categoryController.js";
import * as productController from "../controllers/productController.js";
import * as subCategoryController from "../controllers/subCategoryController.js";
import * as promotionController from "../controllers/promotionController.js";
import * as orderController from "../controllers/orderController.js";
import * as customerController from "../controllers/customerController.js";
import * as orderStatusController from "../controllers/orderStatusController.js";
import * as productReviewController from "../controllers/productReviewController.js";
import * as searchController from "../controllers/searchController.js";
import * as dashboardController from "../controllers/dashboardController.js";
import * as vietnamLocationController from "../controllers/vietnamLocationController.js";
import * as bankController from "../controllers/bankController.js";
import { generate3DModel } from "../controllers/product3DController.js";

import * as tagController from "../controllers/tagController.js";
router.get("/tags", tagController.getAllTags);

import * as articleCategoryController from "../controllers/articleCategoryController.js";

// Import new routes
import campaignRoutes from "./campaignRoutes.js";
import promotionLogRoutes from "./promotionLogRoutes.js";
import rankRoutes from "./rankRoutes.js";
import chatbotRoutes from "./chatbot.js";

// News Categories (Public)
router.get("/news-categories", articleCategoryController.getAll);

// News Categories (Admin/Staff)
router.get(
  "/admin/news-categories/:id",
  authenticateToken,
  isAdminOrStaff,
  articleCategoryController.getById
);
router.post(
  "/admin/news-categories",
  authenticateToken,
  isAdminOrStaff,
  articleCategoryController.create
);
router.put(
  "/admin/news-categories/:id",
  authenticateToken,
  isAdminOrStaff,
  articleCategoryController.update
);
router.delete(
  "/admin/news-categories/:id",
  authenticateToken,
  isAdminOrStaff,
  articleCategoryController.destroy
);

// Role routes
router.get("/role", roleController.getAllRoles);
router.post("/role", roleController.createRole);

// Auth routes
router.post("/auth/register", authController.registerUser);
router.post("/auth/login", authController.loginUser);
router.post("/auth/refresh-token", authController.refreshToken);
router.post("/auth/logout", authenticateToken, authController.logoutUser);
router.get(
  "/auth/current-admin",
  authenticateToken,
  isAdmin,
  authController.currentAdmin
);
router.get(
  "/auth/current-admin-or-staff",
  authenticateToken,
  isAdminOrStaff,
  authController.currentStaffOrAdmin
);
router.get("/auth/current-user", authenticateToken, authController.currentUser);
router.post("/auth/refresh-token", authController.refreshToken);
router.post("/auth/send-otp", authController.sendOtp);
router.post("/auth/verify-otp", authController.verifyOtp);
router.post("/auth/reset-password", authController.resetPassword);

// User routes
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
// Thêm nhân viên (chỉ admin)
router.post("/users", authenticateToken, isAdmin, userController.createUser);

// Sửa nhân viên (admin hoặc staff có thể sửa, tùy bạn)
router.put(
  "/users/:id",
  authenticateToken,
  isAdminOrStaff,
  userController.updateUser
);
// ❌ Chỉ Admin xóa user
router.delete(
  "/users/:id",
  authenticateToken,
  isAdmin,
  userController.deleteUser
);

// Customer routes
router.get("/customers", customerController.getAllCustomers);
router.get(
  "/customers/emails",
  authenticateToken,
  isAdminOrStaff,
  customerController.getCustomerEmails
);
router.get("/customers/:id", customerController.getCustomerById);
router.delete(
  "/customers/:id",
  authenticateToken,
  customerController.deleteCustomer
);
router.put(
  "/customers/profile",
  authenticateToken,
  customerController.updateCustomerProfile
);
router.get("/customers/by-user/:userId", customerController.getCustomer);

// Category routes
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:id", categoryController.getCategoryById);
// ❌ Chỉ Admin được CRUD category
router.post(
  "/categories",
  authenticateToken,
  isAdmin,
  categoryController.createCategory
);
router.put(
  "/categories/:id",
  authenticateToken,
  isAdmin,
  categoryController.updateCategory
);
router.delete(
  "/categories/:id",
  authenticateToken,
  isAdmin,
  categoryController.deleteCategory
);

// Product routes
router.get("/products", productController.getAllProducts);
router.get(
  "/products/with-review-summary",
  productController.getAllProductsWithRatingSummary
);
router.get(
  "/product-by-category",
  productController.getProductsByCategoryWithRatingSummary
);
router.get("/products/similar", getSimilarProducts);
router.get("/products/filter", filterProducts);
router.get("/products/:id", productController.getProductById);
router.get("/get-product-by-slug/:slug", productController.getProductBySlug);
// ✅ Staff & Admin tạo/sửa product
router.post(
  "/products",
  authenticateToken,
  isAdminOrStaff,
  upload.array("images", 5),
  productController.createProduct
);
router.put(
  "/products/:id",
  authenticateToken,
  isAdminOrStaff,
  upload.array("images", 5),
  productController.updateProduct
);
// ❌ Chỉ Admin xóa product
router.delete(
  "/products/:id",
  authenticateToken,
  isAdmin,
  productController.deleteProduct
);
router.get(
  "/get-category-subcategory",
  productController.getCategoryesWithSubCategory
);
router.get(
  "/get-product-top-rated-by-sentiment",
  productController.getTopRatedProductsBySentiment
);

// SubCategory routes
router.get("/subcategories", subCategoryController.getAllSubCategories);
router.get("/subcategories/:id", subCategoryController.getSubCategoryById);
// ❌ Chỉ Admin được CRUD subcategory
router.post(
  "/subcategories",
  authenticateToken,
  isAdmin,
  subCategoryController.createSubCategory
);
router.put(
  "/subcategories/:id",
  authenticateToken,
  isAdmin,
  subCategoryController.updateSubCategory
);
router.delete(
  "/subcategories/:id",
  authenticateToken,
  isAdmin,
  subCategoryController.deleteSubCategory
);

// Promotion routes
router.get("/promotions", promotionController.getAllPromotions);
router.get("/promotions/:id", promotionController.getPromotionById);
router.post(
  "/promotions",
  authenticateToken,
  isAdmin,
  promotionController.createPromotion
);
router.put(
  "/promotions/:id",
  authenticateToken,
  isAdmin,
  promotionController.updatePromotion
);
router.delete(
  "/promotions/:id",
  authenticateToken,
  isAdmin,
  promotionController.deletePromotion
);

// Campaign routes
router.use("/campaigns", campaignRoutes);

// Promotion Log routes
router.use("/promotion-logs", authenticateToken, promotionLogRoutes);

// Rank routes
router.use("/rank", authenticateToken, isAdmin, rankRoutes);

// Chatbot routes
router.use("/chatbot", chatbotRoutes);

// Order routes
router.get("/orders", authenticateToken, isAdmin, orderController.getAllOrders);
router.get(
  "/orders/:id",
  authenticateToken,
  isAdminOrStaff,
  orderController.getOrderById
);
router.post("/orders", authenticateToken, orderController.createOrder);
router.put(
  "/orders/:id",
  authenticateToken,
  isAdminOrStaff,
  orderController.updatedOrder
);
router.put(
  "/update-staff/:id",
  authenticateToken,
  isAdmin,
  orderController.updatedStaff
);
router.get(
  "/orders/by-customer/:user_id",
  authenticateToken,
  orderController.getOrderByCustomer
);
router.patch(
  "/orders/:id/deposit",
  authenticateToken,
  isAdminOrStaff,
  orderController.updateIsDeposit
);
router.post(
  "/calculate-price",
  authenticateToken,
  validateRequest(calculatePriceSchema),
  orderController.calculatePrice
);
router.post(
  "/checkout",
  authenticateToken,
  validateRequest(checkoutSchema),
  orderController.checkout
);
router.get(
  "/orders/by-user/:user_id",
  authenticateToken,
  isAdminOrStaff,
  orderController.getOrderByUserId
);

// Order Status routes
router.get("/order-status", orderStatusController.getAllOrderStatuses);

// Product Review
router.get(
  "/products/:id/reviews",
  productReviewController.getReviewsByProductId
);
router.get(
  "/products/:id/reviews/summary",
  productReviewController.getReviewSummary
);
router.get(
  "/products/:id/reviews/summary-detailed",
  productReviewController.getReviewSummaryWithSuspicious
);

// PUBLIC: Only rating distribution (cho khách hàng)
router.get(
  "/products/:id/reviews/summary-public",
  productReviewController.getReviewSummaryPublic
);

// ADMIN: Full sentiment + rating + suspicious (cho quản lý)
router.get(
  "/admin/products/:id/reviews/summary",
  authenticateToken,
  isAdmin,
  productReviewController.getReviewSummaryPublicDetailed
);

// ADMIN: Lấy tất cả reviews từ tất cả sản phẩm (cho admin dashboard)
router.get(
  "/admin/reviews",
  authenticateToken,
  isAdminOrStaff,
  productReviewController.getAllReviewsAdmin
);

// ADMIN: Thống kê cảm xúc theo sản phẩm
router.get(
  "/admin/reviews/sentiment-stats",
  authenticateToken,
  isAdminOrStaff,
  productReviewController.getSentimentStatsByProduct
);

// ADMIN: Lấy reviews bất thường
router.get(
  "/admin/reviews/suspicious",
  authenticateToken,
  isAdminOrStaff,
  productReviewController.getSuspiciousReviews
);

// ADMIN: Ẩn/Hiển thị review
router.patch(
  "/admin/reviews/:reviewId/visibility",
  authenticateToken,
  isAdminOrStaff,
  productReviewController.toggleReviewVisibility
);

router.post(
  "/products/:id/reviews",
  authenticateToken,
  productReviewController.createReview
);

// Search routes
router.get("/search-product", searchController.searchProducts);
router.get("/quick-search-products", searchController.quickSearchProducts);

//Dashboard routes
router.get(
  "/dashboard/revenue",
  authenticateToken,
  isAdmin,
  dashboardController.getRevenueByPeriod
);
router.get(
  "/dashboard/orders/count",
  authenticateToken,
  isAdmin,
  dashboardController.getOrderCountByPeriod
);

//Location
router.get("/locations/provinces", vietnamLocationController.getProvinces);
router.get(
  "/locations/districts/:provinceCode",
  vietnamLocationController.getDistrictsByProvince
);
router.get(
  "/locations/wards/:districtCode",
  vietnamLocationController.getWardsByDistrict
);

//Bank
router.get("/bank-accounts", bankController.getBankAccounts);
router.post(
  "/bank-accounts",
  authenticateToken,
  isAdmin,
  bankController.createBankAccount
);
router.put(
  "/bank-accounts/:id",
  authenticateToken,
  isAdmin,
  bankController.updateBankAccount
);
router.delete(
  "/bank-accounts/:id",
  authenticateToken,
  isAdmin,
  bankController.deleteBankAccount
);
router.patch(
  "/bank-accounts/:id/enable",
  authenticateToken,
  isAdmin,
  bankController.toggleBankAccountStatus
);

// Public
router.get("/news", articleController.getNews);
router.get("/news/:slug", articleController.getNewsBySlug);

// Admin/Staff - GET tất cả bài (không filter status)
router.get(
  "/admin/news",
  authenticateToken,
  isAdminOrStaff,
  async (req, res, next) => {
    // Gọi getNews nhưng với status = null để lấy tất cả
    req.query.status = null;
    articleController.getNews(req, res, next);
  }
);

// Admin/Staff - GET single bài by ID (for edit page)
router.get(
  "/admin/news/:id",
  authenticateToken,
  isAdminOrStaff,
  articleController.getNewsById
);

// Admin/Staff - POST tạo bài
router.post(
  "/admin/news",
  authenticateToken,
  isAdminOrStaff,
  upload.single("thumbnail"), // bật nếu có upload ảnh
  // validateRequest(createArticleSchema), // TODO: debug validation
  articleController.createNews
);

router.put(
  "/admin/news/:id",
  authenticateToken,
  isAdminOrStaff,
  upload.single("thumbnail"),
  // validateRequest(updateArticleSchema), // TODO: debug validation
  articleController.updateNews
);

router.delete(
  "/admin/news/:id",
  authenticateToken,
  isAdminOrStaff,
  articleController.deleteNews
);

// generate 3d
router.post("/generate-3d/:product_id", generate3DModel);

export default router;
