// controllers/tradesmanApprovalController.js
const TradesmanDetails = require('../models/TradesmanDetails');
const User = require('../models/User');
const transporter = require('../config/email'); // optional for email notify
const { Op } = require('sequelize');

const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, data });

const parsePagination = (req) => {
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;
  const max = 100;
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > max) limit = max;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const tradesmanApprovalController = {
  // GET /admin/tradesmen/pending
  getPending: async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req);
      const { search, tradeType } = req.query;

      const whereDetail = { isApproved: false };
      if (tradeType) whereDetail.tradeType = tradeType;

      const result = await TradesmanDetails.findAndCountAll({
        where: whereDetail,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'mobile', 'role', 'isVerified'],
            where: search ? {
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(result.count / limit);
      return sendResponse(res, 200, true, 'Pending tradesmen fetched', {
        meta: { total: result.count, page, perPage: limit, totalPages },
        data: result.rows
      });
    } catch (err) {
      console.error('getPending error:', err);
      return sendResponse(res, 500, false, 'Server error');
    }
  },

  // POST /admin/tradesmen/:userId/approve
  approve: async (req, res) => {
    try {
      const { userId } = req.params;
      const { note } = req.body; // optional admin note
      const adminId = req.user?.id || null; // from verifyAdminToken

      const details = await TradesmanDetails.findOne({ where: { userId } });
      if (!details) return sendResponse(res, 404, false, 'Tradesman details not found');

      details.isApproved = true;
      details.approvedBy = adminId;
      details.approvedAt = new Date();
      details.rejectionReason = null;
      await details.save();

      // update user's isVerified if you have that column
      const user = await User.findByPk(userId);
      if (user) {
        if ('isVerified' in user) {
          user.isVerified = true;
          await user.save();
        }
      }

      // email notify (non-blocking)
      if (transporter && user && user.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'no-reply@example.com',
            to: user.email,
            subject: 'Your tradesman account is approved',
            html: `<p>Hi ${user.name || ''},</p>
                   <p>Your tradesman account has been <strong>approved</strong> by admin.</p>
                   ${note ? `<p>Note: ${note}</p>` : ''}
                   <p>Thanks,<br/>Team</p>`
          });
        } catch (e) { console.error('Approval email error:', e); }
      }

      return sendResponse(res, 200, true, 'Tradesman approved successfully', { user, details });
    } catch (err) {
      console.error('approve error:', err);
      return sendResponse(res, 500, false, 'Server error');
    }
  },

  // POST /admin/tradesmen/:userId/reject
  reject: async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || null;

      const details = await TradesmanDetails.findOne({ where: { userId } });
      if (!details) return sendResponse(res, 404, false, 'Tradesman details not found');

      details.isApproved = false;
      details.rejectionReason = reason || null;
      details.approvedBy = adminId;
      details.approvedAt = new Date();
      await details.save();

      const user = await User.findByPk(userId);
      if (user) {
        if ('isVerified' in user) {
          user.isVerified = false;
          await user.save();
        }
      }

      // email notify
      if (transporter && user && user.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'no-reply@example.com',
            to: user.email,
            subject: 'Your tradesman request was rejected',
            html: `<p>Hi ${user.name || ''},</p>
                   <p>Your tradesman account request has been <strong>rejected</strong> by admin.</p>
                   ${reason ? `<p>Reason: ${reason}</p>` : '<p>Please update your documents and reapply.</p>'}
                   <p>Thanks,<br/>Team</p>`
          });
        } catch (e) { console.error('Rejection email error:', e); }
      }

      return sendResponse(res, 200, true, 'Tradesman rejected', { user, details });
    } catch (err) {
      console.error('reject error:', err);
      return sendResponse(res, 500, false, 'Server error');
    }
  },

  // GET /admin/tradesmen/:userId
  getOne: async (req, res) => {
    try {
      const { userId } = req.params;
      const details = await TradesmanDetails.findOne({
        where: { userId },
        include: [{ model: User, attributes: ['id', 'name', 'email', 'mobile', 'isVerified'] }]
      });
      if (!details) return sendResponse(res, 404, false, 'Not found');
      return sendResponse(res, 200, true, 'Fetched', details);
    } catch (err) {
      console.error('getOne error:', err);
      return sendResponse(res, 500, false, 'Server error');
    }
  }
};

module.exports = tradesmanApprovalController;
