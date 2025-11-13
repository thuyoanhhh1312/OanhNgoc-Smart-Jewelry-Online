import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CustomerRankHistory = sequelize.define(
  "CustomerRankHistory",
  {
    history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    old_rank: {
      type: DataTypes.ENUM("vip", "gold", "silver", "bronze"),
      allowNull: true,
    },

    new_rank: {
      type: DataTypes.ENUM("vip", "gold", "silver", "bronze"),
      allowNull: false,
    },

    total_spent: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    period_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    period_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "customer_rank_history",
    timestamps: false,
    indexes: [
      {
        fields: ["customer_id", "period_year", "period_month"],
        name: "idx_customer_period",
      },
      {
        fields: ["changed_at"],
        name: "idx_changed_at",
      },
    ],
  }
);

export default CustomerRankHistory;
