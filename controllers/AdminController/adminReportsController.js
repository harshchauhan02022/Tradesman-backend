const User = require("../../models/User");
const UserSubscription = require("../../models/UserSubscription");
const SubscriptionPlan = require("../../models/SubscriptionPlan");
const { Parser } = require("json2csv");

/* ================= USERS REPORT ================= */
const getUsersReport = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "isVerified", "createdAt"],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Users Report Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users report",
    });
  }
};

/* ================= EXPORT USERS CSV ================= */
const exportUsersCSV = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "isVerified", "createdAt"],
      raw: true,
    });

    const parser = new Parser();
    const csv = parser.parse(users);

    res.header("Content-Type", "text/csv");
    res.attachment("users.csv");
    res.send(csv);
  } catch (err) {
    console.error("Export Users CSV Error:", err);
    res.status(500).json({ success: false });
  }
};

/* ================= SUBSCRIPTIONS REPORT ================= */
const getSubscriptionsReport = async (req, res) => {
  try {
    const subs = await UserSubscription.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: ["name", "priceMonthly"],
        },
      ],
    });

    res.json({
      success: true,
      data: subs,
    });
  } catch (err) {
    console.error("Subscriptions Report Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions report",
    });
  }
};

/* ================= EXPORT SUBSCRIPTIONS CSV ================= */
const exportSubscriptionsCSV = async (req, res) => {
  try {
    const subs = await UserSubscription.findAll({
      include: [
        { model: User, as: "user", attributes: ["name", "email"] },
        { model: SubscriptionPlan, as: "plan", attributes: ["name", "priceMonthly"] },
      ],
    });

    const data = subs.map((s) => ({
      user: s.user?.name || "",
      email: s.user?.email || "",
      plan: s.plan?.name || "",
      price: s.plan?.priceMonthly || 0,
      status: s.status,
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("subscriptions.csv");
    res.send(csv);
  } catch (err) {
    console.error("Export Subscriptions CSV Error:", err);
    res.status(500).json({ success: false });
  }
};

/* ✅ EXPORT FUNCTIONS (IMPORTANT) */
module.exports = {
  getUsersReport,
  exportUsersCSV,
  getSubscriptionsReport,
  exportSubscriptionsCSV,
};
