const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const auth = async (req, res, next) => {
  const cookies = req.cookies

  if (!cookies || !cookies.user || !cookies.user.jwt) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  const token = cookies.user.jwt;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const testUser = payload.userId === '64baf069fc54468c05a71552';
    req.user = { userId: payload.userId, testUser };
    next();
  } 
  catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

module.exports = auth;
