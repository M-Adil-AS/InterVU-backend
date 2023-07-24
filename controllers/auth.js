const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  user.createCookie(res, token)

  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      name: user.name,
      id: user._id
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();
  user.createCookie(res, token)

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      name: user.name,
      id: user._id
    },
  });
};

const updateUser = async (req, res) => {
  const { email, name } = req.body;
  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;

  await user.save();

  const token = user.createJWT()
  user.createCookie(res, token)

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      name: user.name,
      id: user._id
    },
  });
};

const updatePassword = async (req, res) => {
  const { password, oldpassword } = req.body;
  if (!password || !oldpassword) {
    throw new BadRequestError('Please provide all values');
  }

  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldpassword);
  if (!isPasswordCorrect) {
    throw new BadRequestError('Incorrect old password');
  }

  user.password = password;
  await user.save();

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      name: user.name,
      id: user._id
    },
  });
};

const info = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      name: user.name,
      id: user._id
    },
  });
};

const logout = async (req, res) => {
  res.cookie('user', '' , {
    httpOnly: true,
    expires: new Date(0)
  })

  res.status(StatusCodes.OK).json({
    user: {}
  });
};

module.exports = {
  register,
  login,
  updateUser,
  info,
  logout,
  updatePassword
};
