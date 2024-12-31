const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  socketId: { type: String }, // Lưu socketId
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", SessionSchema);
