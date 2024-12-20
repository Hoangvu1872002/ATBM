const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    userIDs: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
