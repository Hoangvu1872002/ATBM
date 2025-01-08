const crypto = require("crypto");
require("dotenv").config();

console.log(process.env.AES_KEY);

const encryptionKey = process.env.AES_KEY; // 32 byte key

// Mã hóa nội dung tin nhắn
function encrypt(text, iv) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
// Giải mã nội dung tin nhắn
function decrypt(encryptedText, iv) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
module.exports = {
  encrypt,
  decrypt,
};
