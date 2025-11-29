// controllers/hireController.js
const Hire = require('../models/hireModel');
const { Op } = require('sequelize');

// POST /api/hire/request
// body: { tradesmanId, jobDescription? }
exports.requestHire = async (req, res) => {
  try {
    console.log('REQ.USER IN HIRE ===>', req.user); // debug

    const clientId = req.user?.id;
    const role = req.user?.role;
    const { tradesmanId, jobDescription } = req.body;

    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (role !== 'client') {
      return res.status(403).json({ success: false, message: 'Only clients can send hire request' });
    }

    if (!tradesmanId) {
      return res.status(400).json({ success: false, message: 'tradesmanId is required' });
    }

    // check if already a pending hire between them
    const existingPending = await Hire.findOne({
      where: {
        clientId,
        tradesmanId,
        status: 'pending'
      }
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending hire request with this tradesman'
      });
    }

    const hire = await Hire.create({
      clientId,
      tradesmanId,
      jobDescription: jobDescription || null,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Hire request sent',
      data: hire
    });
  } catch (err) {
    console.error('requestHire error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/hire/respond
// body: { hireId, action: "accept" | "reject" }
exports.respondHire = async (req, res) => {
  try {
    const tradesmanId = req.user?.id;
    const role = req.user?.role;
    const { hireId, action } = req.body;

    if (!tradesmanId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (role !== 'tradesman') {
      return res.status(403).json({ success: false, message: 'Only tradesman can respond to hire' });
    }

    if (!hireId || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'hireId and valid action required' });
    }

    const hire = await Hire.findOne({
      where: { id: hireId, tradesmanId }
    });

    if (!hire) {
      return res.status(404).json({ success: false, message: 'Hire not found' });
    }

    if (hire.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hire is not pending' });
    }

    hire.status = action === 'accept' ? 'accepted' : 'rejected';
    await hire.save();

    return res.status(200).json({
      success: true,
      message: `Hire ${hire.status}`,
      data: hire
    });
  } catch (err) {
    console.error('respondHire error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/hire/complete
// body: { hireId }
exports.completeHire = async (req, res) => {
  try {
    const clientId = req.user?.id;
    const role = req.user?.role;
    const { hireId } = req.body;

    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (role !== 'client') {
      return res.status(403).json({ success: false, message: 'Only client can complete hire' });
    }

    if (!hireId) {
      return res.status(400).json({ success: false, message: 'hireId required' });
    }

    const hire = await Hire.findOne({
      where: { id: hireId, clientId }
    });

    if (!hire) {
      return res.status(404).json({ success: false, message: 'Hire not found' });
    }

    if (hire.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted hire can be completed' });
    }

    hire.status = 'completed';
    await hire.save();

    return res.status(200).json({
      success: true,
      message: 'Hire marked as completed',
      data: hire
    });
  } catch (err) {
    console.error('completeHire error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/hire/status/:userId
// current/latest hire record between logged-in user and given user
exports.getHireStatusForConversation = async (req, res) => {
  try {
    const me = req.user?.id;
    const otherId = parseInt(req.params.userId, 10);

    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!otherId || Number.isNaN(otherId)) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }

    const hire = await Hire.findOne({
      where: {
        [Op.or]: [
          { clientId: me, tradesmanId: otherId },
          { clientId: otherId, tradesmanId: me }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: hire   // null ho sakta hai agar abhi koi hire nahi hai
    });
  } catch (err) {
    console.error('getHireStatusForConversation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
