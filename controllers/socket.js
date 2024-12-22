const Message = require("../models/message"); // Model Message
const Room = require("../models/room"); // Model Room

const handleSocketEvents = (io, socket) => {
  socket.on("getChatList", async () => {
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

      io.emit("receive_message", { user });

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

  socket.on("send_message", async (data) => {
    const { sender, receiver, room, text, image, video, file, system } = data;

    if (!sender || !receiver || !room) {
      return res.status(400).json({
        mes: "Thiếu thông tin cần thiết: sender, receiver hoặc room.",
      });
    }

    if (!text && !image && !video && !file) {
      return res.status(400).json({
        mes: "Phải cung cấp ít nhất một nội dung: text, image, video hoặc file.",
      });
    }

    try {
      // Lưu tin nhắn vào database

      const existingRoom = await RoomModel.findById(room);
      if (!existingRoom) {
        return res.status(404).json({ mes: "Phòng chat không tồn tại." });
      }

      const contentFields = [text, image, video, file];
      const nonEmptyFields = contentFields.filter((field) => field); // Lấy các trường không rỗng

      if (nonEmptyFields.length > 1) {
        return res.status(400).json({
          mes: "Chỉ được phép gửi một trong các trường: text, image, video hoặc file.",
        });
      }

      // Tạo tin nhắn mới
      const newMessage = new MessageModel({
        sender,
        receiver,
        room,
        text,
        image,
        video,
        file,
        system: system || false, // Nếu không phải tin nhắn hệ thống, mặc định là `false`
      });

      // Lưu tin nhắn vào cơ sở dữ liệu
      const savedMessage = await newMessage.save();

      // Lấy toàn bộ tin nhắn của room chat
      const messages = await Message.find({ room: room })
        .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần
        .populate("sender", "name") // Lấy thông tin của sender
        .populate("receiver", "name"); // Lấy thông tin của receiver

      // Gửi tin nhắn đến tất cả user trong phòng chat
      io.to(room).emit("receive_message", { messages });

      return res.status(201).json({
        mes: "Tin nhắn đã được thêm thành công.",
        data: savedMessage,
      });
    } catch (error) {
      console.error("Lỗi khi thêm tin nhắn:", error.message);
      res.status(500).json({ mes: "Lỗi máy chủ khi thêm tin nhắn." });
    }
  });

  // Thêm socket vào phòng chat
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

module.exports = { handleSocketEvents };
