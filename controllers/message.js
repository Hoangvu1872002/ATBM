const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const MessageModel = require("./../models/message");
const RoomModel = require("./../models/room");

const getMessagesInRoom = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.body; // Lấy roomId từ tham số URL

    // Tìm tất cả tin nhắn trong phòng chat đã cho và populate thông tin người gửi và người nhận
    const messages = await MessageModel.find({ room: roomId })
      .populate("sender", "name mobile photos") // Populate thông tin người gửi
      .populate("receiver", "name mobile photos") // Populate thông tin người nhận
      .sort({ createdAt: 1 }); // Sắp xếp tin nhắn theo thời gian (tăng dần: cũ đến mới)

    // Nếu không có tin nhắn
    if (!messages || messages.length === 0) {
      return res.status(404).json({
        mes: "Không có tin nhắn trong phòng chat này.",
      });
    }

    // Trả về danh sách tin nhắn đã populate và sắp xếp
    return res.status(200).json({
      mes: "Danh sách tin nhắn trong phòng chat.",
      messages,
    });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error.message);
    return res.status(500).json({
      mes: "Lỗi máy chủ khi lấy tin nhắn.",
    });
  }
});

module.exports = { getMessagesInRoom };
