const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { type } = require("os");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    name: { type: String },
    dateOfBirth: { type: Date }, // timestamp
    password: { type: String, require: true },
    mobile: { type: String, require: true },
    country: { type: String },
    city: { type: String },
    gender: { type: String },
    photos: [{ type: String }],
    introduce: { type: String },
    hometown: { type: String },
    hobbies: [{ type: String }],
    height: { type: Number },
    weight: { type: Number },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },
  createPasswordChangedToken: function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExprires = Date.now() + 15 * 60 * 1000;
    return resetToken;
  },
};
//Export the model
module.exports = mongoose.model("User", userSchema);
