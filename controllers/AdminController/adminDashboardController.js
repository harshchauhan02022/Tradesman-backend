const { Op, fn, col } = require("sequelize");
const User = require("../../models/User");
const UserSubscription = require("../../models/UserSubscription");
const SubscriptionPlan = require("../../models/SubscriptionPlan");

/* =======================
   OVERVIEW API
======================= */
exports.getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.count();

    const totalClients = await User.count({
      where: { role: "client" },
    });

    const activeTradesmen = await User.count({
      where: { role: "tradesman" },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const subscriptions = await UserSubscription.findAll({
      where: {
        status: "active",
        createdAt: { [Op.gte]: startOfMonth },
      },
      include: [
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: ["priceMonthly"],
        },
      ],
    });

    const monthlyRevenue = subscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan?.priceMonthly || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalClients,
        activeTradesmen,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Dashboard load failed",
    });
  }
};

/* =======================
   ANALYTICS API
======================= */
exports.getAnalytics = async (req, res) => {
  try {
    const userGrowth = await User.findAll({
      attributes: [
        [fn("MONTH", col("createdAt")), "month"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: [fn("MONTH", col("createdAt"))],
      order: [[fn("MONTH", col("createdAt")), "ASC"]],
    });

    const subscriptions = await UserSubscription.findAll({
      where: { status: "active" },
      include: [
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: ["priceMonthly"],
        },
      ],
    });

    const monthlyRevenue = subscriptions.reduce(
      (sum, s) => sum + Number(s.plan?.priceMonthly || 0),
      0
    );

    const tradesmenStats = {
      total: await User.count({ where: { role: "tradesman" } }),
      verified: await User.count({
        where: { role: "tradesman", isVerified: true },
      }),
      pending: await User.count({
        where: { role: "tradesman", isVerified: false },
      }),
    };

    return res.json({
      success: true,
      data: {
        userGrowth,
        monthlyRevenue,
        tradesmenStats,
      },
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    return res.status(500).json({
      success: false,
      message: "Analytics load failed",
    });
  }
};
