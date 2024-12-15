const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");

const userModel = require("../models/user");

const asyncHandler = require("express-async-handler");

const login = asyncHandler(async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password)
    return res.status(400).json({
      mes: "Missing input",
    });

  const response = await userModel.findOne({ mobile });

  if (response && (await response.isCorrectPassword(password))) {
    // tách pw và role ra khỏi response
    const { password, role, refreshToken, ...userData } = response.toObject();
    // tạo access token
    const accessToken = generateAccessToken(response._id, role);
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

module.exports = { login, register };
