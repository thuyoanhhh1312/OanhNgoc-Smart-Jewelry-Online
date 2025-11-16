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

router.get("/news-categories", articleCategoryController.getAll);

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
router.delete(
  "/users/:id",
  authenticateToken,
  isAdminOrStaff,
  userController.deleteUser
);

// Customer routes
router.get("/customers", customerController.getAllCustomers);
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
router.post(
  "/categories",
  authenticateToken,
  isAdminOrStaff,
  categoryController.createCategory
);
router.put(
  "/categories/:id",
  authenticateToken,
  isAdminOrStaff,
  categoryController.updateCategory
);
router.delete(
  "/categories/:id",
  authenticateToken,
  isAdminOrStaff,
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
router.delete(
  "/products/:id",
  authenticateToken,
  isAdminOrStaff,
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
router.post(
  "/subcategories",
  authenticateToken,
  isAdminOrStaff,
  subCategoryController.createSubCategory
);
router.put(
  "/subcategories/:id",
  authenticateToken,
  isAdminOrStaff,
  subCategoryController.updateSubCategory
);
router.delete(
  "/subcategories/:id",
  authenticateToken,
  isAdminOrStaff,
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
router.use("/campaigns", authenticateToken, isAdmin, campaignRoutes);

// Promotion Log routes
router.use("/promotion-logs", authenticateToken, isAdmin, promotionLogRoutes);

// Rank routes
router.use("/rank", authenticateToken, isAdmin, rankRoutes);

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

// Admin/Staff
router.post(
  "/admin/news",
  authenticateToken,
  isAdminOrStaff,
  // upload.single('thumbnail'),    // bật nếu có upload ảnh
  validateRequest(createArticleSchema),
  articleController.createNews
);

router.put(
  "/admin/news/:id",
  authenticateToken,
  isAdminOrStaff,
  // upload.single('thumbnail'),
  validateRequest(updateArticleSchema),
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
