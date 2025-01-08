const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { type } = require("os");
const { encrypt, decrypt } = require("../encryption/AES");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    name: { type: String },
    dateOfBirth: { type: Date },
    password: { type: String, require: true },
    mobile: { type: String, require: true },
    country: { type: String },
    roomIDs: [{ type: mongoose.Types.ObjectId, ref: "Room" }],
    city: { type: String },
    gender: { type: String },
    photos: [{ type: String }],
    introduce: { type: String },
    iv: { type: String },
    // filter: {
    //   ageMax: { type: Number },
    //   ageMin: { type: Number },
    //   gender: { type: String },
    // },
    hometown: { type: String },
    hobbies: [{ type: String }],
    height: { type: Number },
    weight: { type: Number },
    latitude: { type: Number },
    longitude: { type: Number },
    listDislike: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    listLike: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    listBlock: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    listMatch: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const fieldsToEncrypt = [
  "name",
  "introduce",
  // "dateOfBirth",
  "country",
  "city",
  "gender",
  "photos",
  "hometown",
  "hobbies",
  // "height",
  // "weight",
];

userSchema.pre("save", async function (next) {
  // if (!this.isModified("password")) {
  //   next();
  // }
  // const salt = bcrypt.genSaltSync(10);
  // this.password = await bcrypt.hash(this.password, salt);

  try {
    // Mã hóa mật khẩu nếu có thay đổi
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Tạo IV nếu chưa tồn tại
    if (!this.iv) {
      this.iv = crypto.randomBytes(16).toString("hex");
    }

    // Mã hóa các trường được chỉ định trong `fieldsToEncrypt`
    fieldsToEncrypt.forEach((field) => {
      if (this.isModified(field) && this[field]) {
        // Kiểm tra nếu là mảng (ví dụ photos), mã hóa từng phần tử trong mảng
        if (Array.isArray(this[field])) {
          this[field] = this[field].map((item) => encrypt(item, this.iv)); // Mã hóa từng phần tử
        } else {
          this[field] = encrypt(this[field], this.iv); // Mã hóa trường đơn lẻ
        }
      }
    });

    next(); // Tiếp tục
  } catch (err) {
    next(err); // Truyền lỗi đến middleware xử lý lỗi
  }
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

userSchema.methods.decryptFields = function () {
  if (!this.iv) return {}; // Nếu không có IV, trả về đối tượng trống

  // Giải mã tất cả các trường cần thiết
  const decryptedData = {
    ...this.toObject(),
  };
  fieldsToEncrypt.forEach((field) => {
    if (this[field]) {
      if (Array.isArray(this[field])) {
        // Giải mã từng phần tử của mảng
        decryptedData[field] = this[field].map((item) =>
          decrypt(item, this.iv)
        );
      } else {
        // Giải mã trường đơn
        decryptedData[field] = decrypt(this[field], this.iv);
      }
    }
  });

  return decryptedData;
};
//Export the model
module.exports = mongoose.model("User", userSchema);
