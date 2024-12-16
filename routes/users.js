var express = require("express");
var router = express.Router();
const {
  updateInfo,
  getUserInfo,
  uploadImages,
} = require("../controllers/user");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const uploadImage = require("../config/cloudinary.config");

router.get("/get-user-info", verifyAccessToken, getUserInfo);
router.post("/update-info", verifyAccessToken, updateInfo);
router.put(
  "/upload-image",
  verifyAccessToken,
  uploadImage.array("images", 6),
  uploadImages
);

module.exports = router;
