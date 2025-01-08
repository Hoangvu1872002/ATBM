const crypto = require("crypto");
require("dotenv").config();

console.log(process.env.AES_KEY);

const encryptionKey = process.env.AES_KEY; // 32 byte key

// Mã hóa nội dung tin nhắn
function encrypt(data, iv) {
  let jsonString;

  // Nếu là Date, chuyển thành ISO string
  if (data instanceof Date) {
    jsonString = JSON.stringify({ value: data.toISOString(), type: "date" });
  } else {
    jsonString = JSON.stringify(data); // Các kiểu khác
  }

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(jsonString, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Hàm giải mã
function decrypt(encryptedText, iv) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  const parsed = JSON.parse(decrypted);

  // Nếu phát hiện kiểu Date, khôi phục về dạng Date object
  if (parsed.type === "date") {
    return new Date(parsed.value);
  }

  return parsed; // Các kiểu dữ liệu khác
}
module.exports = {
  encrypt,
  decrypt,
};
