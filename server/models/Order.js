import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define(
  "Order",
  {
    order_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    promotion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    sub_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // **Mức đặt cọc (10% tổng)**
    deposit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    is_deposit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Trạng thái thanh toán đặt cọc: 'pending', 'paid', 'none'
    deposit_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },

    shipping_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    transaction_id: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: "Mã giao dịch từ cổng thanh toán (VNPay, MoMo...)",
    },

    payment_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Thông tin chi tiết từ cổng thanh toán (VNPayParams, MoMo response...)",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

export default Order;
