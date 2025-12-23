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
    },

    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

/* =======================
   ✅ Associations (ONLY ONCE)
======================= */

// user_subscriptions → users
UserSubscription.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(UserSubscription, {
  foreignKey: "userId",
  as: "subscriptions",
});

// user_subscriptions → subscription_plans
UserSubscription.belongsTo(SubscriptionPlan, {
  foreignKey: "planId",
  as: "plan",
});

SubscriptionPlan.hasMany(UserSubscription, {
  foreignKey: "planId",
  as: "userSubscriptions",
});

module.exports = UserSubscription;
