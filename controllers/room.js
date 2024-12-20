const RoomModel = require("../models/room");
const MessageModel = require("../models/message");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const addRoom = asyncHandler(async (req, res) => {
  try {
    const { userIDs } = req.body; // Lấy danh sách userIDs từ body của request

    // Kiểm tra danh sách userIDs
    if (!Array.isArray(userIDs) || userIDs.length !== 2) {
      return res
        .status(400)
        .json({ mes: "Phòng chat phải chứa đúng 2 người dùng." });
    }

    // Chuyển đổi userIDs sang ObjectId
    const userIDsObject = userIDs.map((id) => mongoose.Types.ObjectId(id));

    // Kiểm tra xem phòng chat đã tồn tại chưa
    const existingRoom = await RoomModel.findOne({
      userIDs: { $all: userIDsObject }, // Kiểm tra 2 userIDs đã có trong cùng một phòng chat
    });

    if (existingRoom) {
      return res.status(200).json({
        mes: "Phòng chat đã tồn tại.",
        room: existingRoom,
      });
    }

    const systemMessage = new MessageModel({
      sender: null, // Tin nhắn hệ thống không có người gửi cụ thể
      receiver: null,
      system: true, // Đánh dấu là tin nhắn hệ thống
      room: existingRoom._id,
      text: "Hai bạn hãy bắt đầu gửi nhau những lời yêu thương.", // Nội dung tin nhắn
    });

    await systemMessage.save();

    // Tạo phòng chat mới nếu chưa tồn tại
    const newRoom = new RoomModel({ userIDs: userIDsObject });
    const savedRoom = await newRoom.save();

    return res.status(201).json({
      mes: "Phòng chat đã được tạo thành công.",
      room: savedRoom,
    });
  } catch (error) {
    console.error("Lỗi khi thêm phòng chat:", error.message);
    res.status(500).json({ mes: "Lỗi máy chủ khi tạo phòng chat." });
  }
});

const removeRoomFromUser = asyncHandler(async (req, res) => {
  try {
    const userID = req.user._id; // Lấy userID từ req.user sau khi xác thực token
    const { roomID } = req.body; // Lấy roomID từ body của request

    // Kiểm tra xem roomID có được cung cấp không
    if (!roomID) {
      return res.status(400).json({ mes: "Thiếu roomID." });
    }

    // Xóa roomID khỏi danh sách roomIDs của người dùng
    const updatedUser = await UserModel.findByIdAndUpdate(
      userID,
      { $pull: { roomIDs: mongoose.Types.ObjectId(roomID) } }, // $pull để xóa phần tử khỏi mảng
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!updatedUser) {
      return res.status(404).json({ mes: "Người dùng không tồn tại." });
    }

    return res.status(200).json({
      mes: "Đã xóa phòng chat khỏi danh sách của người dùng.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi xóa phòng chat:", error.message);
    res.status(500).json({ mes: "Lỗi máy chủ khi xóa phòng chat." });
  }
});

const getAllRooms = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user; // Lấy userId từ token

    // Tìm tất cả các phòng chat mà người dùng tham gia và lấy thông tin người dùng tham gia trong từng phòng chat
    const user = await UserModel.findById(_id).populate({
      path: "roomIDs", // Tên trường chứa các phòng chat của người dùng
      populate: {
        path: "userIDs", // Tên trường chứa userIDs trong mỗi phòng chat
        select: "name _id photos", // Chọn các trường cần thiết của user (có thể thay đổi theo yêu cầu)
      },
    });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return res.status(404).json({
        mes: "Người dùng không tồn tại.",
      });
    }

    // Trả về danh sách các phòng chat và thông tin người dùng trong các phòng
    return res.status(200).json({
      mes: "Danh sách phòng chat của người dùng.",
      rooms: user.roomIDs, // Mảng các phòng chat với thông tin người dùng
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng chat:", error.message);
    return res.status(500).json({
      mes: "Lỗi máy chủ khi lấy danh sách phòng chat.",
    });
  }
});

module.exports = { addRoom, removeRoomFromUser, getAllRooms };
