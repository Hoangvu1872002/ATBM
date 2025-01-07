const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");

const userModel = require("../models/user");
const Session = require("../models/session");

const asyncHandler = require("express-async-handler");

const login = asyncHandler(async (req, res) => {
  const { mobile, password, deviceId } = req.body;
  if (!mobile || !password || !deviceId)
    return res.status(400).json({
      mes: "Missing input",
    });

  // Lưu thông tin đăng nhập vào MongoDB
  await Session.create({ mobile, deviceId });

  const response = await userModel.findOne({ mobile });

  if (response && (await response.isCorrectPassword(password))) {
    // tách pw và role ra khỏi response
    const { password, refreshToken, ...userData } = response.toObject();
    // tạo access token
    const accessToken = generateAccessToken(response._id);
    // tạo refresh token
    const newRefreshToken = generateRefreshToken(response._id);
    //Lưu refresh token vào database
    await userModel.findByIdAndUpdate(
      response._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    // Lưu refresh token vào cookie
    return res.status(200).json({
      accessToken,
      userInfo: userData,
    });
  } else {
    throw new Error("Invalid credenttials!");
  }
});

const register = asyncHandler(async (req, res) => {
  const { password, mobile } = req.body;

  if (!mobile || !password)
    return res.status(400).json({
      mes: "Missing input!",
    });

  const response = await userModel.findOne({ mobile });
  if (response) {
    return res.status(400).json({
      mes: "Exist number mobile.",
    });
  }

  try {
    const newUser = await userModel.create({
      password,
      mobile,
    });

    return res.status(200).json({
      mes: "Register new user successfully",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const checkSession = asyncHandler(async (req, res) => {
  const { userId, deviceId } = req.body;

  try {
    const session = await Session.findOne({ userId, deviceId });

    if (session) {
      res.status(200).json({ exists: true, mes: "Session is active." });
    } else {
      res.status(404).json({ exists: false, mes: "Session not found." });
    }
  } catch (error) {
    console.error("Error in check-session:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

const logout = asyncHandler(async (req, res) => {
  const { deviceId } = req.body;
  const { _id } = req.user;

  if (!deviceId) {
    return res.status(400).json({ mes: "userId and deviceId are required." });
  }

  try {
    await Session.findOneAndDelete({ _id, deviceId });
    res.status(200).json({ mes: "Logout successful." });
  } catch (error) {
    console.error("Error in /logout:", error);
    res.status(500).json({ mes: "Internal server error." });
  }
});

module.exports = { login, register, checkSession, logout };
