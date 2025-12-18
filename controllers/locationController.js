const TravelPlan = require("../models/locationModel");
const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const Review = require("../models/reviewModel");
const { Op, fn, col } = require("sequelize"); // ✅ FIXED

const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, data });

// ================= Helper =================
async function getActivePlanForUser(userId) {
  return await UserSubscription.findOne({
    where: { userId, status: "active" },
    include: [{ model: SubscriptionPlan, as: "plan" }],
  });
}

function parseStops(stops) {
  if (!stops) return null;

  let arr = Array.isArray(stops)
    ? stops
    : typeof stops === "string"
    ? stops.split(",").map(s => s.trim())
    : null;

  if (!arr || !arr.length) return null;
  return arr.slice(0, 4);
}

// ================= CREATE =================
exports.createTravelPlan = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== "tradesman")
      return sendResponse(res, 403, false, "Only tradesmen can create plans");

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

    if (!startLocation || !destination)
      return sendResponse(res, 400, false, "startLocation & destination required");

    const activeSub = await getActivePlanForUser(userId);
    if (!activeSub)
      return sendResponse(res, 403, false, "Subscription required");

    const maxShared = activeSub.plan.maxSharedLocations;
    if (maxShared !== null) {
      const count = await TravelPlan.count({ where: { tradesmanId: userId } });
      if (count >= maxShared)
        return sendResponse(res, 403, false, "Plan limit reached");
    }

    const plan = await TravelPlan.create({
      tradesmanId: userId,
      currentLocation,
      startLocation,
      destination,
      priceRange,
      allowStops,
      stops: parseStops(stops),
      startDate,
      endDate,
    });

    return sendResponse(res, 201, true, "Travel plan created", plan);
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, false, "Server error");
  }
};

// ================= MY PLANS =================
exports.getMyTravelPlans = async (req, res) => {
  try {
    const plans = await TravelPlan.findAll({
      where: { tradesmanId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    return sendResponse(res, 200, true, "My plans", plans);
  } catch (err) {
    return sendResponse(res, 500, false, "Server error");
  }
};

// ================= UPDATE =================
exports.updateTravelPlan = async (req, res) => {
  try {
    const plan = await TravelPlan.findByPk(req.params.id);
    if (!plan) return sendResponse(res, 404, false, "Plan not found");
    if (plan.tradesmanId !== req.user.id)
      return sendResponse(res, 403, false, "Not allowed");

    Object.assign(plan, req.body);
    if (req.body.stops) plan.stops = parseStops(req.body.stops);

    await plan.save();
    return sendResponse(res, 200, true, "Updated", plan);
  } catch (err) {
    return sendResponse(res, 500, false, "Server error");
  }
};

// ================= DELETE =================
exports.deleteTravelPlan = async (req, res) => {
  try {
    const plan = await TravelPlan.findByPk(req.params.id);
    if (!plan) return sendResponse(res, 404, false, "Plan not found");
    if (plan.tradesmanId !== req.user.id)
      return sendResponse(res, 403, false, "Not allowed");

    await plan.destroy();
    return sendResponse(res, 200, true, "Deleted");
  } catch (err) {
    return sendResponse(res, 500, false, "Server error");
  }
};

// ================= TRADESMAN PROFILE =================
exports.getTradesmanProfile = async (req, res) => {
  try {
    const { tradesmanId } = req.params;

    const tradesman = await User.findOne({
      where: { id: tradesmanId, role: "tradesman" },
      attributes: ["id", "name", "profileImage"],
    });

    if (!tradesman)
      return sendResponse(res, 404, false, "Tradesman not found");

    const travelPlan = await TravelPlan.findOne({
      where: { tradesmanId, status: "open" },
      order: [["createdAt", "DESC"]],
    });

    const ratingAgg = await Review.findOne({
      where: { toUserId: tradesmanId },
      attributes: [
        [fn("AVG", col("rating")), "avgRating"],
        [fn("COUNT", col("id")), "reviewCount"],
      ],
      raw: true,
    });

    const response = {
      id: tradesman.id,
      name: tradesman.name,
      profileImage: tradesman.profileImage,
    
      rating: ratingAgg?.avgRating
        ? Number(ratingAgg.avgRating).toFixed(1)
        : "0.0",
    
      reviewCount: ratingAgg?.reviewCount || 0,
    
      location: travelPlan
        ? {
            current: travelPlan.currentLocation || null,
            start: travelPlan.startLocation,
            destination: travelPlan.destination,
            stops: travelPlan.allowStops ? travelPlan.stops : []
          }
        : null,
    
      availability: travelPlan ? "Available Today" : "Not Available",
      priceRange: travelPlan?.priceRange || null
    };
    

    return sendResponse(res, 200, true, "Profile fetched", response);
  } catch (err) {
    console.error("getTradesmanProfile error:", err);
    return sendResponse(res, 500, false, "Server error");
  }
};
