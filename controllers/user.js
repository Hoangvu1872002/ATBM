const userModel = require("../models/user");

const asyncHandler = require("express-async-handler");

const getCurrentInfo = asyncHandler(async (req, res) => {
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

  if (
    !name ||
    !dateOfBirth ||
    !country ||
    !city ||
    !req.files ||
    req.files.length === 0
  ) {
    return res.status(400).json({
      success: false,
      mes: "Missing required fields!",
    });
  }

  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      _id,
      {
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
        photos: req.files.map((el) => el.path),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      mes: "Update success!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to update user information.",
    });
  }
});

const addToListLike = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại
  const { userIdToAdd } = req.body; // ID của user cần thêm vào listLike

  if (!userIdToAdd) {
    return res.status(400).json({
      success: false,
      mes: "Missing required userIdToAdd!",
    });
  }

  try {
    // Tìm user hiện tại và đối phương
    const user = await userModel.findById(_id);
    const targetUser = await userModel.findById(userIdToAdd);

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Kiểm tra nếu đối phương có trong listDislike của người dùng hiện tại
    const inListDislike = user.listDislike.includes(userIdToAdd);
    if (inListDislike) {
      // Loại bỏ đối phương khỏi listDislike của người dùng hiện tại
      user.listDislike = user.listDislike.filter(
        (userId) => userId.toString() !== userIdToAdd
      );
    }

    // Kiểm tra xem đối phương đã thích mình chưa (có trong listLike của họ)
    const inTargetUserListLike = targetUser.listLike.includes(_id);
    const inUserListLike = user.listLike.includes(userIdToAdd);

    // console.log(inTargetUserListLike);

    if (inTargetUserListLike) {
      console.log("aa");

      // Nếu đối phương đã thích mình, loại bỏ mình khỏi listLike của họ
      targetUser.listLike = targetUser.listLike.filter(
        (userId) => userId.toString() !== _id
      );

      // Thêm vào listMatch của cả hai người
      user.listMatch.push(userIdToAdd);
      targetUser.listMatch.push(_id);
    } else {
      // Nếu đối phương chưa thích mình, chỉ thêm vào danh sách listLike của user hiện tại
      if (!inUserListLike) {
        user.listLike.push(userIdToAdd);
      }
    }

    // Lưu thay đổi cho cả hai người dùng
    await user.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      mes: "User added to listLike or listMatch successfully!",
      data: {
        listLike: user.listLike,
        listMatch: user.listMatch,
        listDislike: user.listDislike,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to add user to listLike.",
    });
  }
});

const addToListDislike = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại
  const { userIdToDislike } = req.body; // ID của user cần thêm vào listDislike

  if (!userIdToDislike) {
    return res.status(400).json({
      success: false,
      mes: "Missing required userIdToDislike!",
    });
  }

  try {
    // Tìm user hiện tại và đối phương
    const user = await userModel.findById(_id);
    const targetUser = await userModel.findById(userIdToDislike);

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Kiểm tra nếu đối phương có trong listLike của user hiện tại, nếu có thì xóa
    if (user.listLike.includes(userIdToDislike)) {
      user.listLike = user.listLike.filter(
        (userId) => userId.toString() !== userIdToDislike
      );
    }

    // Kiểm tra nếu cả hai người đang trong listMatch, nếu có thì xóa cả hai khỏi listMatch
    if (user.listMatch.includes(userIdToDislike)) {
      user.listMatch = user.listMatch.filter(
        (userId) => userId.toString() !== userIdToDislike
      );
      targetUser.listMatch = targetUser.listMatch.filter(
        (userId) => userId.toString() !== _id
      );
      // Thêm người dùng hiện tại vào listLike của đối phương
      targetUser.listLike.push(_id);
    }

    // Thêm đối phương vào listDislike của mình
    if (!user.listDislike.includes(userIdToDislike)) {
      user.listDislike.push(userIdToDislike);
    }

    // Lưu thay đổi cho cả hai người
    await user.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      mes: "User added to listDislike and updated successfully!",
      data: {
        listLike: user.listLike,
        listDislike: user.listDislike,
        listMatch: user.listMatch,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to add user to listDislike.",
    });
  }
});

const removeFromListLike = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại
  const { userIdToRemove } = req.body; // ID của user cần loại bỏ khỏi listLike

  if (!userIdToRemove) {
    return res.status(400).json({
      success: false,
      mes: "Missing required userIdToRemove!",
    });
  }

  try {
    // Tìm user hiện tại
    const user = await userModel.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Kiểm tra nếu userIdToRemove có trong listLike
    const inListLike = user.listLike.includes(userIdToRemove);

    if (!inListLike) {
      return res.status(400).json({
        success: false,
        mes: "User not found in listLike!",
      });
    }

    // Loại bỏ userIdToRemove khỏi listLike
    user.listLike = user.listLike.filter(
      (userId) => userId.toString() !== userIdToRemove
    );

    // Lưu thay đổi
    await user.save();

    res.status(200).json({
      success: true,
      mes: "User removed from listLike successfully!",
      data: {
        listLike: user.listLike,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to remove user from listLike.",
    });
  }
});

const removeFromListDislike = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại
  const { userIdToRemove } = req.body; // ID của user cần loại bỏ khỏi listDislike

  if (!userIdToRemove) {
    return res.status(400).json({
      success: false,
      mes: "Missing required userIdToRemove!",
    });
  }

  try {
    // Tìm user hiện tại
    const user = await userModel.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Kiểm tra nếu userIdToRemove có trong listDislike
    const inListDislike = user.listDislike.includes(userIdToRemove);

    if (!inListDislike) {
      return res.status(400).json({
        success: false,
        mes: "User not found in listDislike!",
      });
    }

    // Loại bỏ userIdToRemove khỏi listDislike
    user.listDislike = user.listDislike.filter(
      (userId) => userId.toString() !== userIdToRemove
    );

    // Lưu thay đổi
    await user.save();

    res.status(200).json({
      success: true,
      mes: "User removed from listDislike successfully!",
      data: {
        listDislike: user.listDislike,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to remove user from listDislike.",
    });
  }
});

const getAllUsersExcludingLists = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại

  try {
    // Tìm thông tin người dùng hiện tại
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Lọc danh sách users ngoại trừ những người có trong listLike, listDislike, và listMatch
    const excludedUsers = [
      ...user.listLike,
      ...user.listDislike,
      ...user.listMatch,
    ];

    // Tìm tất cả users nhưng loại bỏ những user trong danh sách excludedUsers
    const users = await userModel
      .find({
        _id: { $nin: excludedUsers },
      })
      .select("-password"); // Loại bỏ password khỏi kết quả

    res.status(200).json({
      success: true,
      mes: "Users fetched successfully!",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch users.",
    });
  }
});

const getUsersInLikeList = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại

  try {
    // Tìm thông tin người dùng hiện tại
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Lấy danh sách người dùng có trong listLike
    const usersInLike = await userModel
      .find({
        _id: { $in: user.listLike }, // Tìm những người có ID trong listLike
      })
      .select("-password"); // Loại bỏ password khỏi kết quả

    res.status(200).json({
      success: true,
      mes: "Users in listLike fetched successfully!",
      data: usersInLike,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch users in listLike.",
    });
  }
});

const getUsersInDislikeList = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại

  try {
    // Tìm thông tin người dùng hiện tại
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Lấy danh sách người dùng có trong listDislike
    const usersInDislike = await userModel
      .find({
        _id: { $in: user.listDislike }, // Tìm những người có ID trong listDislike
      })
      .select("-password"); // Loại bỏ password khỏi kết quả

    res.status(200).json({
      success: true,
      mes: "Users in listDislike fetched successfully!",
      data: usersInDislike,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch users in listDislike.",
    });
  }
});

const getUsersInMatchList = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại

  try {
    // Tìm thông tin người dùng hiện tại
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    // Lấy danh sách người dùng có trong listMatch
    const usersInMatch = await userModel
      .find({
        _id: { $in: user.listMatch }, // Tìm những người có ID trong listMatch
      })
      .select("-password"); // Loại bỏ password khỏi kết quả

    res.status(200).json({
      success: true,
      mes: "Users in listMatch fetched successfully!",
      data: usersInMatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch users in listMatch.",
    });
  }
});

const getUsersWhoLikedMe = asyncHandler(async (req, res) => {
  const { _id } = req.user; // ID của user hiện tại

  try {
    // Tìm tất cả người dùng đã thích người dùng hiện tại (ID của người dùng hiện tại có trong listLike của họ)
    const usersWhoLikedMe = await userModel
      .find({
        listLike: { $in: [_id] }, // Tìm những người có ID người dùng hiện tại trong listLike của họ
      })
      .select("-password"); // Loại bỏ password khỏi kết quả

    res.status(200).json({
      success: true,
      mes: "Users who liked you fetched successfully!",
      data: usersWhoLikedMe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch users who liked you.",
    });
  }
});

const getUserInfo = asyncHandler(async (req, res) => {
  const { userId } = req.body; // Lấy userId từ body

  if (!userId) {
    return res.status(400).json({
      success: false,
      mes: "User ID is required!",
    });
  }

  try {
    // Tìm thông tin người dùng theo userId
    const user = await userModel.findById(userId).select("-password"); // Loại bỏ password khỏi kết quả

    if (!user) {
      return res.status(404).json({
        success: false,
        mes: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      mes: "User info fetched successfully!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: error.message || "Failed to fetch user info.",
    });
  }
});

module.exports = {
  removeFromListLike,
  getUserInfo,
  getCurrentInfo,
  updateInfo,
  addToListLike,
  addToListDislike,
  removeFromListLike,
  removeFromListDislike,
  getAllUsersExcludingLists,
  getUsersInLikeList,
  getUsersInDislikeList,
  getUsersInMatchList,
  getUsersWhoLikedMe,
};
