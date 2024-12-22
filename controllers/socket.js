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
        console.log("Người dùng không tồn tại.");
      }

      socket.emit("receive_message", { user });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng chat:", error.message);
    }
  });

  socket.on("send_message", async (data) => {
    const { sender, receiver, room, text, image, video, file, system } = data;

    if (!sender || !receiver || !room) {
      console.log("Thiếu thông tin cần thiết: sender, receiver hoặc room.");
    }

    if (!text && !image && !video && !file) {
      console.log(
        "Phải cung cấp ít nhất một nội dung: text, image, video hoặc file."
      );
    }

    try {
      // Lưu tin nhắn vào database

      const existingRoom = await RoomModel.findById(room);
      if (!existingRoom) {
        console.log("Phòng chat không tồn tại.");
      }

      const contentFields = [text, image, video, file];
      const nonEmptyFields = contentFields.filter((field) => field); // Lấy các trường không rỗng

      if (nonEmptyFields.length > 1) {
        console.log(
          "Chỉ được phép gửi một trong các trường: text, image, video hoặc file."
        );
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

      console.log("Tin nhắn đã được thêm thành công.");
    } catch (error) {
      console.error("Lỗi khi thêm tin nhắn:", error.message);
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
