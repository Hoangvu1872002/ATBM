const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Types.ObjectId, ref: "User" },
    system: { type: Boolean, default: false },
    room: { type: mongoose.Types.ObjectId, ref: "Room" },
    revoked: { type: Boolean, default: false },
    text: { type: String },
    image: { type: String },
    video: { type: String },
    file: { type: String },
    status: {
      type: String,
      enum: ["received", "watched"],
      default: "received",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
