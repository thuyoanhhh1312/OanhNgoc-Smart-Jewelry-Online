import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import sequelize from "../config/db.js";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = {};

// Đọc tất cả file model trừ index.js
const files = fs
  .readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"));

for (const file of files) {
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const { default: model } = await import(fileUrl);
  db[model.name] = model;
}

// Lấy các model ra
const {
  Product,
  Category,
  SubCategory,
  ProductImage,
  User,
  Role,
  Promotion,
  Customer,
  ProductReview,
  Order,
  OrderItem,
  OrderStatus,
  BankAccount,
  PromotionUsage,
  Article,
  Tag,
  ArticleTag,
  ArticleCategory,
  PromotionCampaign,
  PromotionLog,
  CustomerRankHistory,
  GoldPrice,
} = db;

// Associations:

// Product - Category (N:1)
if (Product && Category) {
  Product.belongsTo(Category, { foreignKey: "category_id" });
  Category.hasMany(Product, { foreignKey: "category_id" });
}

// Product - SubCategory (N:1)
if (Product && SubCategory) {
  Product.belongsTo(SubCategory, { foreignKey: "subcategory_id" });
  SubCategory.hasMany(Product, { foreignKey: "subcategory_id" });
}

// Product - ProductImage (1:N)
if (Product && ProductImage) {
  Product.hasMany(ProductImage, { foreignKey: "product_id" });
  ProductImage.belongsTo(Product, { foreignKey: "product_id" });
}

// SubCategory - Category (N:1)
if (SubCategory && Category) {
  SubCategory.belongsTo(Category, { foreignKey: "category_id" });
  Category.hasMany(SubCategory, { foreignKey: "category_id" });
}

// User - Role (N:1)
if (User && Role) {
  User.belongsTo(Role, { foreignKey: "role_id" });
  Role.hasMany(User, { foreignKey: "role_id" });
}

// Customer - User (N:1)
if (Customer && User) {
  Customer.belongsTo(User, { foreignKey: "user_id" });
  User.hasMany(Customer, { foreignKey: "user_id" });
}

// ProductReview - Product (N:1)
if (ProductReview && Product) {
  ProductReview.belongsTo(Product, { foreignKey: "product_id" });
  Product.hasMany(ProductReview, { foreignKey: "product_id" });
}

// ProductReview - Customer (N:1)
if (ProductReview && Customer) {
  ProductReview.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(ProductReview, { foreignKey: "customer_id" });
}

// Order - Customer (N:1)
if (Order && Customer) {
  Order.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(Order, { foreignKey: "customer_id" });
}

// Order - User (nhân viên xử lý đơn) (N:1)
if (Order && User) {
  Order.belongsTo(User, { foreignKey: "user_id" });
  User.hasMany(Order, { foreignKey: "user_id" });
}

// Order - Promotion (N:1)
if (Order && Promotion) {
  Order.belongsTo(Promotion, { foreignKey: "promotion_id" });
  Promotion.hasMany(Order, { foreignKey: "promotion_id" });
}

// OrderItem - Order (N:1)
if (OrderItem && Order) {
  OrderItem.belongsTo(Order, { foreignKey: "order_id" });
  Order.hasMany(OrderItem, { foreignKey: "order_id" });
}

// OrderItem - Product (N:1)
if (OrderItem && Product) {
  OrderItem.belongsTo(Product, { foreignKey: "product_id" });
  Product.hasMany(OrderItem, { foreignKey: "product_id" });
}

if (Order && OrderStatus) {
  Order.belongsTo(OrderStatus, { foreignKey: "status_id" });
  OrderStatus.hasMany(Order, { foreignKey: "status_id" });
}

// PromotionUsage - Customer (N:1)
if (PromotionUsage && Customer) {
  PromotionUsage.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(PromotionUsage, { foreignKey: "customer_id" });
}

// PromotionUsage - Promotion (N:1)
if (PromotionUsage && Promotion) {
  PromotionUsage.belongsTo(Promotion, { foreignKey: "promotion_id" });
  Promotion.hasMany(PromotionUsage, { foreignKey: "promotion_id" });
}

// PromotionUsage - Order (N:1)
if (PromotionUsage && Order) {
  PromotionUsage.belongsTo(Order, { foreignKey: "order_id" });
  Order.hasMany(PromotionUsage, { foreignKey: "order_id" });
}

// PromotionUsage - Customer (N:1)
if (PromotionUsage && Customer) {
  PromotionUsage.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(PromotionUsage, { foreignKey: "customer_id" });
}

// PromotionUsage - Promotion (N:1)
if (PromotionUsage && Promotion) {
  PromotionUsage.belongsTo(Promotion, { foreignKey: "promotion_id" });
  Promotion.hasMany(PromotionUsage, { foreignKey: "promotion_id" });
}

// // PromotionUsage - Order (N:1)
// if (PromotionUsage && Order) {
//   PromotionUsage.belongsTo(Order, { foreignKey: 'order_id' });
//   Order.hasMany(PromotionUsage, { foreignKey: 'order_id' });
// }

// Article - ArticleCategory (N:1)
if (Article && ArticleCategory) {
  Article.belongsTo(ArticleCategory, {
    foreignKey: "article_category_id",
    as: "category",
  });
  ArticleCategory.hasMany(Article, {
    foreignKey: "article_category_id",
    as: "articles",
  });
}

// Tag many-to-many (nếu đã tạo Tag & ArticleTag)
if (Article && Tag && ArticleTag) {
  Article.belongsToMany(Tag, {
    through: ArticleTag,
    foreignKey: "article_id",
    otherKey: "tag_id",
    as: "tags",
  });
  Tag.belongsToMany(Article, {
    through: ArticleTag,
    foreignKey: "tag_id",
    otherKey: "article_id",
    as: "articles",
  });
}

// PromotionCampaign - Promotion (1:N)
if (PromotionCampaign && Promotion) {
  PromotionCampaign.hasMany(Promotion, {
    foreignKey: "campaign_id",
    as: "promotions",
  });
  Promotion.belongsTo(PromotionCampaign, {
    foreignKey: "campaign_id",
    as: "campaign",
  });
}

// PromotionLog - Customer (N:1)
if (PromotionLog && Customer) {
  PromotionLog.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(PromotionLog, { foreignKey: "customer_id" });
}

// PromotionLog - Promotion (N:1)
if (PromotionLog && Promotion) {
  PromotionLog.belongsTo(Promotion, { foreignKey: "promotion_id" });
  Promotion.hasMany(PromotionLog, { foreignKey: "promotion_id" });
}

// CustomerRankHistory - Customer (N:1)
if (CustomerRankHistory && Customer) {
  CustomerRankHistory.belongsTo(Customer, { foreignKey: "customer_id" });
  Customer.hasMany(CustomerRankHistory, { foreignKey: "customer_id" });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
