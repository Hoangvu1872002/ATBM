const Message = require("../models/message"); // Model Message
const RoomModel = require("../models/room");
const UserModel = require("../models/user"); // Model Room

const handleSocketEvents = (io, socket) => {
  socket.on("getChatList", async (data) => {
    try {
      const userId = data.userId;

      // Lấy tất cả các phòng mà người dùng tham gia
      const user = await UserModel.findById(userId).populate({
        path: "roomIDs",
        populate: {
          path: "userIDs",
          select: "name _id photos", // Chỉ lấy các thông tin cần thiết
        },
      });

      if (!user) {
        return socket.emit("getChatList", {
          error: "Người dùng không tồn tại.",
        });
      }

      const chatList = await Promise.all(
        user.roomIDs.map(async (room) => {
          // Lấy thông tin đối phương (ngoại trừ userId hiện tại)
          const opponents = room.userIDs.filter(
            (user) => user._id.toString() !== userId
          );

          // Nếu không có đối phương (phòng chỉ có 1 người), bỏ qua
          if (opponents.length === 0) return null;

          // Lấy thông tin người đối phương (lấy phần tử đầu tiên)
          const opponent = opponents[0];

          // Lấy tin nhắn mới nhất trong phòng
          const latestMessage = await MessageModel.findOne({ room: room._id })
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian mới nhất
            .populate({
              path: "sender",
              select: "name _id photos", // Lấy thông tin người gửi
            });

          if (latestMessage) {
            // Kiểm tra nếu tồn tại image, video hoặc file
            let text = latestMessage.text;
            if (
              latestMessage.image ||
              latestMessage.video ||
              latestMessage.file
            ) {
              text = "Tệp đính kèm.";
            }

            // Trả thông tin phòng chat
            return {
              userID: opponent._id,
              userName: opponent.name,
              message: text,
              time: latestMessage.createdAt,
              isNewMessage: latestMessage.status,
              avatar: opponent.photos?.[0] || null, // Lấy ảnh đại diện đầu tiên (nếu có)
              userIsSendMes:
                latestMessage.sender._id.toString() === userId ? true : false, // So sánh chính xác
            };
          }

          // Nếu không có tin nhắn, bỏ qua phòng này
          return null;
        })
      );

      // Loại bỏ các giá trị null trong mảng chatList
      const filteredChatList = chatList.filter((item) => item !== null);

      // Trả kết quả về client
      socket.emit("getChatList", { chatList: filteredChatList });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng chat:", error.message);
      socket.emit("getChatList", { error: "Đã xảy ra lỗi, vui lòng thử lại." });
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
