import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const GoldPrice = sequelize.define(
  "GoldPrice",
  {
    gold_price_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    gold_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Loại vàng: Vàng miễn SJC, Nhẫn Tròn PNJ, etc...",
    },

    purity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Độ tinh khiết: 999.9, 999, etc...",
    },

    buy_price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      comment: "Giá mua (nghìn đ/chỉ)",
    },

    sell_price: {
      type: DataTypes.DECIMAL(15, 0),
      allowNull: false,
      comment: "Giá bán (nghìn đ/chỉ)",
    },

    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nơi mua: TP.HCM, Hà Nội, etc...",
    },

    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "PNJ",
      comment: "Nguồn: PNJ, SJC, etc...",
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "gold_prices",
    timestamps: false,
  }
);

export default GoldPrice;
