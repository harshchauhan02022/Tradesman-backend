const Hire = require("../models/hireModel");
const User = require("../models/User");
const { Op } = require("sequelize");
const { io, onlineUsers } = require("../server");

const sendResponse = (res, status, success, message, data = null) =>
  res.status(status).json({ success, message, data });

/* =========================
   1️⃣ Client → Hire Request
========================= */
exports.requestHire = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { tradesmanId, jobDescription } = req.body;

    if (!tradesmanId)
      return sendResponse(res, 400, false, "tradesmanId required");

    const existing = await Hire.findOne({
      where: { clientId, tradesmanId, status: "pending" }
    });

    if (existing)
      return sendResponse(res, 400, false, "Pending request already exists");

    const hire = await Hire.create({
      clientId,
      tradesmanId,
      jobDescription,
      status: "pending"
    });

    const traderSocket = onlineUsers[tradesmanId];
    if (traderSocket) {
      io.to(traderSocket).emit("hire_request", {
        hireId: hire.id,
        clientId,
        jobDescription
      });
    }

    return sendResponse(res, 201, true, "Hire request sent", hire);

  } catch (err) {
    console.error("requestHire:", err);
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   2️⃣ Tradesman → Accept / Reject
========================= */
exports.respondHire = async (req, res) => {
  try {
    const tradesmanId = req.user.id;
    const { hireId, action } = req.body;

    if (!hireId || !["accept", "reject"].includes(action))
      return sendResponse(res, 400, false, "Invalid action");

    const hire = await Hire.findOne({
      where: { id: hireId, tradesmanId }
    });

    if (!hire)
      return sendResponse(res, 404, false, "Hire not found");

    hire.status = action === "accept" ? "accepted" : "rejected";
    await hire.save();

    const clientSocket = onlineUsers[hire.clientId];
    if (clientSocket) {
      io.to(clientSocket).emit("hire_response", {
        hireId: hire.id,
        status: hire.status
      });
    }

    return sendResponse(res, 200, true, "Hire updated", hire);

  } catch (err) {
    console.error("respondHire:", err);
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   3️⃣ Tradesman → Request Completion
========================= */
exports.requestJobCompletion = async (req, res) => {
  try {
    const tradesmanId = req.user.id;
    const { hireId } = req.body;

    if (!hireId)
      return sendResponse(res, 400, false, "hireId required");

    const hire = await Hire.findOne({
      where: { id: hireId, tradesmanId }
    });

    if (!hire)
      return sendResponse(res, 404, false, "Hire not found");

    if (hire.status !== "accepted")
      return sendResponse(res, 400, false, "Job not accepted");

    hire.requestCompletion = true;
    await hire.save();

    const clientSocket = onlineUsers[hire.clientId];
    if (clientSocket) {
      io.to(clientSocket).emit("job_complete_request", {
        hireId: hire.id
      });
    }

    return sendResponse(res, 200, true, "Completion request sent");

  } catch (err) {
    console.error("requestJobCompletion:", err);
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   4️⃣ Client → YES / NO
========================= */
exports.confirmJobCompletion = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { hireId, confirm } = req.body;

    if (typeof confirm !== "boolean")
      return sendResponse(res, 400, false, "confirm must be boolean");

    const hire = await Hire.findOne({
      where: { id: hireId, clientId }
    });

    if (!hire)
      return sendResponse(res, 404, false, "Hire not found");

    if (!hire.requestCompletion)
      return sendResponse(res, 400, false, "No pending request");

    if (!confirm) {
      hire.requestCompletion = false;
      await hire.save();
      return sendResponse(res, 200, true, "Completion denied");
    }

    hire.status = "completed";
    hire.requestCompletion = false;
    await hire.save();

    const traderSocket = onlineUsers[hire.tradesmanId];
    if (traderSocket) {
      io.to(traderSocket).emit("job_completed", {
        hireId: hire.id
      });
    }

    return sendResponse(res, 200, true, "Job completed", hire);

  } catch (err) {
    console.error("confirmJobCompletion:", err);
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   5️⃣ Pending completion check
========================= */
exports.getPendingCompletionStatus = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { hireId } = req.params;

    const hire = await Hire.findOne({
      where: { id: hireId, clientId },
      attributes: ["id", "status", "requestCompletion"]
    });

    if (!hire)
      return sendResponse(res, 404, false, "Hire not found");

    return sendResponse(res, 200, true, "Status", hire);

  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   6️⃣ Chat hire status
========================= */
exports.getHireStatusForConversation = async (req, res) => {
  try {
    const me = req.user.id;
    const otherId = req.params.userId;

    const hire = await Hire.findOne({
      where: {
        [Op.or]: [
          { clientId: me, tradesmanId: otherId },
          { clientId: otherId, tradesmanId: me }
        ]
      },
      order: [["createdAt", "DESC"]]
    });

    return sendResponse(res, 200, true, "Hire status", hire);

  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

/* =========================
   7️⃣ My Jobs
========================= */
exports.getMyJobs = async (req, res) => {
  try {
    const { id, role } = req.user;

    const where =
      role === "client"
        ? { clientId: id }
        : { tradesmanId: id };

    const jobs = await Hire.findAll({
      where,
      include: [
        { model: User, as: "client", attributes: ["id", "name"] },
        { model: User, as: "tradesman", attributes: ["id", "name"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    return sendResponse(res, 200, true, "Jobs fetched", jobs);

  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
