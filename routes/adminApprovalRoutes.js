// routes/adminApprovalRoutes.js
const express = require('express');
const router = express.Router();

const { verifyAdminToken } = require('../middlewares/adminAuthMiddleware');
const tradesmanApprovalController = require('../controllers/tradesmanApprovalController');

// list pending (GET /admin/tradesmen/pending)
router.get('/tradesmen/pending', verifyAdminToken, tradesmanApprovalController.getPending);

// approve (POST /admin/tradesmen/:userId/approve)
router.post('/tradesmen/:userId/approve', verifyAdminToken, tradesmanApprovalController.approve);

// reject (POST /admin/tradesmen/:userId/reject)
router.post('/tradesmen/:userId/reject', verifyAdminToken, tradesmanApprovalController.reject);

// fetch single (GET /admin/tradesmen/:userId)
router.get('/tradesmen/:userId', verifyAdminToken, tradesmanApprovalController.getOne);

module.exports = router;
