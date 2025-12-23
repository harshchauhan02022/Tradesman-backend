// controllers/reviewController.js
const Review = require("../models/reviewModel");
const Hire = require("../models/hireModel");

exports.addReview = async (req, res) => {
  try {
    const fromUserId = req.user.id; // client
    const { hireId, rating, comment } = req.body;

    const hire = await Hire.findOne({ where: { id: hireId } });
    if (!hire) {
      return res.status(404).json({ success: false, message: "Hire not found" });
    }

    if (hire.status !== "completed") {
      return res.status(400).json({ success: false, message: "Job not completed" });
    }

    if (hire.clientId !== fromUserId) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const already = await Review.findOne({ where: { hireId } });
    if (already) {
      return res.status(400).json({ success: false, message: "Review already added" });
    }

    const review = await Review.create({
      hireId,
      fromUserId,
      toUserId: hire.tradesmanId,
      rating,
      comment,
      jobDate: new Date()
    });

    return res.json({ success: true, message: "Review added", data: review });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
