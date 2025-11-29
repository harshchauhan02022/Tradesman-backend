// controllers/subscriptionController.js
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");

const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, data });

// GET /api/subscriptions/plans  -> list for Subscription screen
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [["priceMonthly", "ASC"]],
    });
    return sendResponse(res, 200, true, "Plans fetched", plans);
  } catch (err) {
    console.error("getPlans error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};

// GET /api/subscriptions/my  -> current plan for logged-in tradesman
exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, 401, false, "Unauthorized");

    const sub = await UserSubscription.findOne({
      where: { userId, status: "active" },
      include: [{ model: SubscriptionPlan, as: "plan" }],
    });

    return sendResponse(res, 200, true, "Current subscription", sub);
  } catch (err) {
    console.error("getMySubscription error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};

// POST /api/subscriptions/upgrade
// body: { planId }
exports.upgradePlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { planId } = req.body;

    if (!userId) return sendResponse(res, 401, false, "Unauthorized");
    if (role !== "tradesman")
      return sendResponse(res, 403, false, "Only tradesmen can upgrade plan");

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) return sendResponse(res, 404, false, "Plan not found");

    // purana active subscription expire karo
    await UserSubscription.update(
      { status: "expired", endDate: new Date() },
      { where: { userId, status: "active" } }
    );

    const sub = await UserSubscription.create({
      userId,
      planId: plan.id,
      startDate: new Date(),
      status: "active",
    });

    return sendResponse(res, 200, true, "Plan upgraded", sub);
  } catch (err) {
    console.error("upgradePlan error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};
