// controllers/chatController.js
const Message = require('../models/messageModel');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * Small helper to send consistent responses
 */
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  return res.status(statusCode).json({ success, message, data, error });
};

/**
 * Pagination helper
 */
const parsePagination = (req, defaultLimit = 20) => {
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || defaultLimit;
  const maxLimit = 100;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginatedResponse = (res, message, items, total, page, limit) => {
  const totalPages = limit ? Math.ceil(total / limit) : 1;
  return sendResponse(res, 200, true, message, {
    meta: { total, page, perPage: limit, totalPages },
    data: items,
  });
};

// ============================================
// POST /api/chat/send
// ============================================
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, message } = req.body;

    if (!senderId)
      return sendResponse(res, 401, false, 'Unauthorized');

    if (!receiverId || !message)
      return sendResponse(res, 400, false, 'receiverId and message required');

    const newMsg = await Message.create({
      senderId,
      receiverId,
      message,
      isRead: false
    });

    return sendResponse(res, 201, true, 'Message sent', newMsg);
  } catch (err) {
    console.error('sendMessage error:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

// ============================================
// GET /api/chat/conversation/:userId
// Supports pagination: ?page=1&limit=20
// ============================================
exports.getConversation = async (req, res) => {
  try {
    const loggedUser = parseInt(req.user.id, 10);
    const otherUserId = parseInt(req.params.userId, 10);

    if (!loggedUser) return sendResponse(res, 401, false, 'Unauthorized');

    if (!otherUserId) return sendResponse(res, 400, false, 'Invalid userId');

    const { page, limit, offset } = parsePagination(req, 20);

    // find messages between two users with pagination
    const where = {
      [Op.or]: [
        { senderId: loggedUser, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: loggedUser }
      ]
    };

    const result = await Message.findAndCountAll({
      where,
      order: [['createdAt', 'ASC']], // chronological order
      limit,
      offset
    });

    const messages = result.rows;

    // fetch involved users info in bulk
    const userIds = Array.from(new Set(messages.flatMap(m => [m.senderId, m.receiverId])));
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'role', 'profileImage', 'email']
    });
    const userMap = {};
    users.forEach(u => (userMap[u.id] = u));

    // transform messages to include helpful fields
    const out = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      message: m.message,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isMine: m.senderId === loggedUser,
      sender: userMap[m.senderId] || null,
      receiver: userMap[m.receiverId] || null
    }));

    return paginatedResponse(res, 'Conversation fetched', out, result.count, page, limit);
  } catch (err) {
    console.error('getConversation error:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

// ============================================
// GET /api/chat/list
// Returns list of conversations (one entry per other user) with lastMessage & unreadCount
// Supports pagination: ?page=1&limit=20
// ============================================
exports.getChatList = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);

    if (!userId) return sendResponse(res, 401, false, 'Unauthorized');

    const { page, limit } = parsePagination(req, 20);

    // Fetch latest messages involving user ordered by newest first.
    // We'll dedupe by other participant while preserving recency to form conversations.
    // Note: for very large message tables consider optimizing with a dedicated "conversations" table.
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      order: [['createdAt', 'DESC']]
      // no limit here because we need to dedupe by conversation; if table is large change approach
    });

    // Build ordered unique list of other participant IDs and map messages per conversation
    const seen = new Set();
    const convoOrder = []; // array of otherUserId in order of latest message (desc)
    const convoMessages = {}; // otherId => [messages (desc)]

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!convoMessages[otherId]) convoMessages[otherId] = [];
      convoMessages[otherId].push(msg);

      if (!seen.has(otherId)) {
        seen.add(otherId);
        convoOrder.push(otherId);
      }
    }

    const totalConvos = convoOrder.length;

    // paginate convoOrder
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageConvoIds = convoOrder.slice(start, end);

    // Bulk fetch user info for page conversations
    const otherUsers = await User.findAll({
      where: { id: pageConvoIds },
      attributes: ['id', 'name', 'email', 'role', 'profileImage']
    });
    const otherMap = {};
    otherUsers.forEach(u => (otherMap[u.id] = u));

    // Build chatList items
    const chatList = pageConvoIds.map(otherId => {
      const msgs = convoMessages[otherId] || [];
      const lastMessage = msgs[0] || null; // we ordered messages desc earlier
      // unread count for this conversation: messages sent by otherId to userId and isRead=false
      const unreadCount = msgs.filter(m => m.senderId === otherId && !m.isRead).length;

      return {
        withUser: otherMap[otherId] || { id: otherId },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              receiverId: lastMessage.receiverId,
              message: lastMessage.message,
              isRead: lastMessage.isRead,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === userId
            }
          : null,
        unreadCount,
        messages: msgs.map(m => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: m.message,
          isRead: m.isRead,
          createdAt: m.createdAt,
          isMine: m.senderId === userId
        }))
      };
    });

    return paginatedResponse(res, 'Chat list fetched', chatList, totalConvos, page, limit);
  } catch (err) {
    console.error('getChatList error:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};

// ============================================
// PUT /api/chat/mark-read
// body: { conversationWith: <userId> }
// ============================================
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { conversationWith } = req.body;

    if (!userId) return sendResponse(res, 401, false, 'Unauthorized');
    if (!conversationWith) return sendResponse(res, 400, false, 'conversationWith is required');

    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: conversationWith,
          receiverId: userId,
          isRead: false
        }
      }
    );

    return sendResponse(res, 200, true, 'Messages marked as read', { updated: updatedCount });
  } catch (err) {
    console.error('markAsRead error:', err);
    return sendResponse(res, 500, false, 'Server error');
  }
};
