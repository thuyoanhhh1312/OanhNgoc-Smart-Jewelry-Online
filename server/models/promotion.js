import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Promotion = sequelize.define(
  "Promotion",
  {
    promotion_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    promotion_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    segment_target: {
      type: DataTypes.STRING(50),
      allowNull: true, // 'birthday', 'vip', 'gold', 'silver', 'bronze', null (all)
    },

    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "promotion",
    timestamps: false,
    indexes: [
      {
        fields: ["segment_target"],
        name: "idx_promotion_segment",
      },
      {
        fields: ["campaign_id"],
        name: "idx_promotion_campaign",
      },
    ],
  }
);

export default Promotion;
