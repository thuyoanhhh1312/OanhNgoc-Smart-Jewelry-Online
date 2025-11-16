import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PasswordResetOtp = sequelize.define(
  "PasswordResetOtp",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_reset_otps",
    timestamps: false,
    indexes: [
      {
        fields: ["email"],
        unique: true,
      },
      {
        fields: ["expired_at"],
      },
    ],
  }
);

export default PasswordResetOtp;
