const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Types.ObjectId, ref: "User" },
    system: { type: Boolean, default: false },
    text: { type: String },
    image: { type: String },
    video: { type: String },
    file: { type: String },
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
