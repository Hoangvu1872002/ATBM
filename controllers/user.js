const userModel = require("../models/user");

const asyncHandler = require("express-async-handler");

const getUserInfo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await userModel.findById(_id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateInfo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const {
    name,
    dateOfBirth,
    country,
    city,
    gender,
    introductory,
    hometown,
    hobby,
    height,
    weight,
  } = req.body;
  // console.log(req.body);
  if (!name || !dateOfBirth || !country || !city) {
    return res.status(400).json({
      success: false,
      mes: "Missing input!",
    });
  }

  await userModel.findByIdAndUpdate(_id, {
    name,
    dateOfBirth,
    country,
    city,
    gender,
    introduce: introductory,
    hometown,
    hobbies: hobby,
    height,
    weight,
  });
  res.status(200).json({
    success: true,
    mes: "Update success!",
  });
});

const uploadImages = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.files) throw new Error("Missing inputs.");
  try {
    await userModel.findByIdAndUpdate(
      _id,
      {
        $push: { photos: { $each: req.files.map((el) => el.path) } },
      },
      { new: true }
    );
    return res.status(200).json({
      status: true,
      mes: "Success upload images user.",
    });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = { getUserInfo, updateInfo, uploadImages };
