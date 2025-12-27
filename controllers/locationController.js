const TravelPlan = require("../models/locationModel");
const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const Review = require("../models/reviewModel");
const { Op, fn, col } = require("sequelize");

// ================= RESPONSE HELPER =================
const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, data });

// ================= SUBSCRIPTION HELPER =================
async function getActivePlanForUser(userId) {
  return await UserSubscription.findOne({
    where: { userId, status: "active" },
    include: [{ model: SubscriptionPlan, as: "plan" }],
  });
}
async function getActivePlanForUser(userId) {
  return await UserSubscription.findOne({
    where: { userId, status: "active" },
    include: [{ model: SubscriptionPlan, as: "plan" }],
  });
}

// ================= STOPS PARSER =================
function parseStops(stops) {
  if (!stops) return null;

  let arr = Array.isArray(stops)
    ? stops
    : typeof stops === "string"
      ? stops.split(",").map((s) => s.trim())
      : null;

  if (!arr || !arr.length) return null;
  return arr.slice(0, 4);
}

exports.createTravelPlan = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== "tradesman") {
      return sendResponse(res, 403, false, "Only tradesmen can create plans");
    }

    const {
      currentLocation,
      latitude,        // ✅ NEW
      longitude,       // ✅ NEW
      startLocation,
      destination,
      priceRange,
      allowStops,
      stops,
      startDate,
      endDate,
    } = req.body;

    if (!startLocation || !destination || !startDate || !endDate) {
      return sendResponse(res, 400, false, "All fields required");
    }

    const overlapPlan = await TravelPlan.findOne({
      where: {
        tradesmanId: userId,
        status: "open",
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
      },
    });

    if (overlapPlan) {
      return sendResponse(
        res,
        400,
        false,
        "Active travel plan already exists"
      );
    }

    const plan = await TravelPlan.create({
      tradesmanId: userId,
      currentLocation,
      latitude,          // ✅ SAVE
      longitude,         // ✅ SAVE
      startLocation,
      destination,
      priceRange,
      allowStops,
      stops: parseStops(stops),
      startDate,
      endDate,
      status: "open",
    });

    return sendResponse(res, 201, true, "Travel plan created", plan);
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, false, "Server error");
  }
};

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

exports.updateMyTravelPlan = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== "tradesman") {
      return sendResponse(res, 403, false, "Only tradesmen allowed");
    }

    const plan = await TravelPlan.findOne({
      where: {
        tradesmanId: userId,
        status: "open",
        endDate: { [Op.gte]: new Date() },
      },
    });

    if (!plan) {
      return sendResponse(res, 404, false, "No active travel plan found");
    }

    const {
      currentLocation,
      latitude,        // ✅ NEW
      longitude,       // ✅ NEW
      startLocation,
      destination,
      priceRange,
      allowStops,
      stops,
      startDate,
      endDate,
      status,
    } = req.body;

    if (currentLocation !== undefined) plan.currentLocation = currentLocation;
    if (latitude !== undefined) plan.latitude = latitude;       // ✅
    if (longitude !== undefined) plan.longitude = longitude;    // ✅
    if (startLocation !== undefined) plan.startLocation = startLocation;
    if (destination !== undefined) plan.destination = destination;
    if (priceRange !== undefined) plan.priceRange = priceRange;
    if (allowStops !== undefined) plan.allowStops = allowStops;
    if (status !== undefined) plan.status = status;

    if (stops !== undefined) {
      plan.stops = allowStops ? parseStops(stops) : null;
    }

    if (startDate !== undefined) plan.startDate = startDate;
    if (endDate !== undefined) plan.endDate = endDate;

    await plan.save();

    return sendResponse(res, 200, true, "Travel plan updated", plan);
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, false, "Server error");
  }
};

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
      where: {
        tradesmanId,
        status: "open",
        endDate: { [Op.gte]: new Date() } // ✅ only endDate check
      },
      order: [["startDate", "ASC"]],
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
          current: travelPlan.currentLocation,
          start: travelPlan.startLocation,
          destination: travelPlan.destination,
          stops: travelPlan.allowStops ? travelPlan.stops : [],
          startDate: travelPlan.startDate,
          endDate: travelPlan.endDate,
          status:
            new Date() < travelPlan.startDate
              ? "Upcoming"
              : "Active",
        }
        : null,

      availability: travelPlan ? "Available" : "Not Available",
      priceRange: travelPlan?.priceRange || null,
    };

    return sendResponse(res, 200, true, "Profile fetched", response);
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, false, "Server error");
  }
};



