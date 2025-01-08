const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userId: { type: String },
  mobile: { type: String },
  deviceName: { type: String },
  address: { type: String },
  iv: { type: String },
  deviceId: { type: String, required: true },
  socketId: { type: String }, // Lưu socketId
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", SessionSchema);
