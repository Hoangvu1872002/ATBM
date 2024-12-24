const MessageModel = require("../models/message"); // Model Message
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
            .sort({ createdAt: 1 }) // Sắp xếp theo thời gian mới nhất
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

      filteredChatList.reverse();

      // Trả kết quả về client
      socket.emit("getChatList", { chatList: filteredChatList });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng chat:", error.message);
      socket.emit("getChatList", { error: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
  });

  socket.on("getAllMessages", async (data) => {
    const { userId, guestId } = data;

    try {
      // Tìm phòng chat có chứa cả hai userId và guestId
      const room = await RoomModel.findOne({
        userIDs: { $all: [userId, guestId] }, // Kiểm tra cả hai userId đều có trong phòng
      });

      if (!room) {
        return socket.emit("getAllMessages", {
          status: "error",
          message: "Không tìm thấy phòng chat giữa hai người.",
        });
      }

      // Lấy tất cả tin nhắn của phòng chat và sắp xếp theo thời gian
      const messages = await MessageModel.find({ room: room._id })
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tăng dần (hoặc -1 nếu muốn giảm dần)
        .populate({
          path: "sender",
          select: "name _id photos", // Lấy thông tin người gửi
        })
        .populate({
          path: "receiver",
          select: "name _id photos", // Lấy thông tin người nhận
        });

      const formattedMessages = messages.map((msg) => {
        const senderInfo = msg.sender
          ? {
              _id: msg.sender._id.toString(),
              name: msg.sender.name,
              avatar: msg.sender.photos?.[0] || null, // Lấy ảnh đầu tiên hoặc null nếu không có
            }
          : null;

        const receiverInfo = msg.receiver
          ? {
              _id: msg.receiver._id.toString(),
              name: msg.receiver.name,
              avatar: msg.receiver.photos?.[0] || null, // Lấy ảnh đầu tiên hoặc null nếu không có
            }
          : null;

        return {
          _id: msg._id,
          createdAt: msg.createdAt,
          pending: false,
          received: true,
          sent: false,
          text: msg.text,
          user: senderInfo,
          // guest:
          //   receiverInfo && receiverInfo._id === userId ? receiverInfo : null,
          system: msg.system,
          image: msg.image,
          video: msg.video,
          file: msg.file,
        };
      });

      // Trả về danh sách tin nhắn và thông tin phòng chat
      socket.emit("getAllMessages", formattedMessages);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tin nhắn:", error);
      socket.emit("getAllMessages", {
        status: "error",
        message: "Đã xảy ra lỗi khi lấy danh sách tin nhắn.",
      });
    }
  });

  socket.on("send_message", async (data) => {
    const { guestId, message } = data;

    if (!message.user || !guestId) {
      console.log("Thiếu thông tin cần thiết: sender, receiver hoặc room.");
    }

    if (!message.text && !message.image && !message.video && !message.file) {
      console.log(
        "Phải cung cấp ít nhất một nội dung: text, image, video hoặc file."
      );
    }

    try {
      const room = await RoomModel.findOne({
        userIDs: { $all: [message.user._id, guestId] }, // Kiểm tra cả hai userId đều có trong phòng
      });

      if (!room) {
        return socket.emit("sendMessage", {
          status: "error",
          message: "Không tìm thấy phòng chat giữa hai người.",
        });
      }

      const contentFields = [
        message.text,
        message.image,
        message.video,
        message.file,
      ];
      const nonEmptyFields = contentFields.filter((field) => field); // Lấy các trường không rỗng

      if (nonEmptyFields.length > 1) {
        console.log(
          "Chỉ được phép gửi một trong các trường: text, image, video hoặc file."
        );
      }

      // Tạo tin nhắn mới
      const newMessage = new MessageModel({
        sender: message.user._id,
        receiver: guestId,
        room: room._id,
        text: message.text,
        image: message.image,
        video: message.video,
        file: message.file,
        system: false, // Nếu không phải tin nhắn hệ thống, mặc định là `false`
      });

      // Lưu tin nhắn vào cơ sở dữ liệu
      const savedMessage = await newMessage.save();
      await savedMessage.populate({
        path: "sender",
        select: "_id name photos", // Chỉ lấy các trường cần thiết
      });

      const formattedMessage = (msg) => {
        const senderInfo = msg.sender
          ? {
              _id: msg.sender._id.toString(),
              name: msg.sender.name,
              avatar: msg.sender.photos?.[0] || null, // Lấy ảnh đầu tiên hoặc null nếu không có
            }
          : null;

        return {
          _id: msg._id,
          createdAt: msg.createdAt,
          pending: false,
          received: true,
          sent: false,
          text: msg.text,
          // guest: senderInfo,
          user: senderInfo,
          system: msg.system,
          image: msg.image,
          video: msg.video,
          file: msg.file,
        };
      };

      const data = formattedMessage(savedMessage);

      // Lấy toàn bộ tin nhắn của room chat
      // const messages = await Message.find({ room: room })
      //   .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần
      //   .populate("sender", "name") // Lấy thông tin của sender
      //   .populate("receiver", "name"); // Lấy thông tin của receiver

      // // Gửi tin nhắn đến tất cả user trong phòng chat
      io.emit("newMessage", data);

      console.log("Tin nhắn đã được thêm thành công.");
    } catch (error) {
      console.error("Lỗi khi thêm tin nhắn:", error.message);
    }
  });

  socket.on("revoked_message", async (data) => {
    try {
      const { messageId, userId, guestId } = data; // messageId: id của tin nhắn cần thu hồi, userId: id của người yêu cầu thu hồi

      // Tìm tin nhắn trong cơ sở dữ liệu
      const message = await MessageModel.findById(messageId);

      if (!message) {
        return socket.emit("revoked_message_error", {
          error: "Tin nhắn không tồn tại.",
        });
      }

      // Kiểm tra nếu người yêu cầu thu hồi là người gửi tin nhắn
      if (message.sender.toString() !== userId) {
        return socket.emit("revoked_message_error", {
          error: "Bạn không thể thu hồi tin nhắn này.",
        });
      }

      // Cập nhật trạng thái của tin nhắn thành "revoked"
      message.status = "revoked";
      await message.save();

      // Thông báo cho các client (kể cả người gửi và người nhận) về việc thu hồi tin nhắn
      io.emit("message_revoked", {
        userId,
        guestId,
        messageId,
        status: "revoked",
      });
      socket.emit("message_revoked", {
        userId,
        guestId,
        messageId,
        status: "revoked",
      });

      console.log("Tin nhắn đã bị thu hồi", messageId);
    } catch (error) {
      console.error("Lỗi khi thu hồi tin nhắn:", error);
      socket.emit("revoked_message_error", {
        error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    }
  });

  socket.on("update_rows", () => {
    io.emit("update_rows");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

module.exports = { handleSocketEvents };
