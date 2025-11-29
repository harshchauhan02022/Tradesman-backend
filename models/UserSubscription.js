// models/UserSubscription.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const SubscriptionPlan = require("./SubscriptionPlan");

const UserSubscription = sequelize.define(
  "UserSubscription",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },

    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "subscription_plans", key: "id" },
    },

    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled"),
      defaultValue: "active",
    },
  },
  {
    tableName: "user_subscriptions",
    timestamps: true,
  }
);

UserSubscription.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(UserSubscription, { foreignKey: "userId", as: "subscriptions" });

UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: "planId", as: "plan" });
SubscriptionPlan.hasMany(UserSubscription, { foreignKey: "planId", as: "userSubscriptions" });

module.exports = UserSubscription;
