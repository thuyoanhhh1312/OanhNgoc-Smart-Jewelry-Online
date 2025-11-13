import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Customer = sequelize.define(
  "Customer",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    segment_type: {
      type: DataTypes.ENUM("vip", "gold", "silver", "bronze"),
      allowNull: false,
      defaultValue: "bronze",
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
    tableName: "customer",
    timestamps: false,
    indexes: [
      {
        fields: ["birthday"],
        name: "idx_customer_birthday",
      },
      {
        fields: ["segment_type"],
        name: "idx_customer_segment",
      },
    ],
  }
);

export default Customer;
