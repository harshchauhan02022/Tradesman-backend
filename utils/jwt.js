// utils/jwt.js
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,   // ⚠️ ye zaroor bhejna hai
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { signToken };
