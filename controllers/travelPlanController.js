const TravelPlan = require("../models/TravelPlan");
const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const { Op } = require("sequelize");

const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, data });

// helper: active subscription + plan
async function getActivePlanForUser(userId) {
  return await UserSubscription.findOne({
    where: { userId, status: "active" },
    include: [{ model: SubscriptionPlan, as: "plan" }],
  });
}

/**
 * POST /api/travel-plans
 */
exports.createTravelPlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return sendResponse(res, 401, false, "Unauthorized");
    if (role !== "tradesman")
      return sendResponse(res, 403, false, "Only tradesmen can create travel plans");

    const {
      currentLocation,
      startLocation,
      destination,
      priceRange,
      allowStops,
      stops,
      startDate,
      endDate,
    } = req.body;

    if (!startLocation || !destination) {
      return sendResponse(res, 400, false, "startLocation and destination are required");
    }

    // 👉 Subscription limit check
    const activeSub = await getActivePlanForUser(userId);
    if (!activeSub) {
      return sendResponse(res, 403, false, "No active subscription. Please subscribe first.");
    }

    const maxShared = activeSub.plan.maxSharedLocations; // number or null
    if (maxShared !== null && maxShared !== undefined) {
      const count = await TravelPlan.count({ where: { tradesmanId: userId } });
      if (count >= maxShared) {
        return sendResponse(
          res,
          403,
          false,
          `You reached your limit (${maxShared}) for this plan. Please upgrade to create more travel plans.`
        );
      }
    }

    // stops handle
    let stopsArray = null;
    if (stops) {
      if (Array.isArray(stops)) {
        stopsArray = stops;
      } else if (typeof stops === "string") {
        stopsArray = stops
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      if (stopsArray.length > 4) {
        stopsArray = stopsArray.slice(0, 4);
      }
    }

    const plan = await TravelPlan.create({
      tradesmanId: userId,
      currentLocation: currentLocation || null,
      startLocation,
      destination,
      priceRange: priceRange || null,
      allowStops: allowStops === true || allowStops === "true",
      stops: stopsArray,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    return sendResponse(res, 201, true, "Travel plan created", plan);
  } catch (err) {
    console.error("createTravelPlan error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};

/**
 * GET /api/travel-plans/my
 */
exports.getMyTravelPlans = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return sendResponse(res, 401, false, "Unauthorized");
    if (role !== "tradesman")
      return sendResponse(res, 403, false, "Only tradesmen can view plans");

    const plans = await TravelPlan.findAll({
      where: { tradesmanId: userId },
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, 200, true, "Travel plans fetched", plans);
  } catch (err) {
    console.error("getMyTravelPlans error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};
