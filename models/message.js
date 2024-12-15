const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Types.ObjectId, ref: "User" }, // id của người gửi
    receiver: { type: mongoose.Types.ObjectId, ref: "User" }, // id của người nhận
    text: { type: String },
    image: { type: String }, // đường dẫn ảnh
    video: { type: String }, // đường dẫn video
    file: { type: String }, // đường dẫn file
    status: {
      type: String,
      enum: ["sent", "received", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
