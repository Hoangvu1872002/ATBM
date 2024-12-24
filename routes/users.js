var express = require("express");
var router = express.Router();
const {
  getUserInfo,
  updateInfo,
  addToListLike,
  addToListDislike,
  removeFromListLike,
  removeFromListDislike,
  getAllUsersExcludingLists,
  getUsersInLikeList,
  getUsersInDislikeList,
  getUsersInMatchList,
  getUsersWhoLikedMe,
  getCurrentInfo,
  updateUserLocation,
} = require("../controllers/user");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const uploadImage = require("../config/cloudinary.config");

router.get("/get-current-info", verifyAccessToken, getCurrentInfo);
router.get("/get-user-info", verifyAccessToken, getUserInfo);
router.post(
  "/update-info",
  verifyAccessToken,
  uploadImage.array("images", 6),
  updateInfo
);
router.post("/remove-from-listlike", verifyAccessToken, removeFromListLike);
router.post(
  "/remove-from-listdislike",
  verifyAccessToken,
  removeFromListDislike
);
router.post("/add-to-listlike", verifyAccessToken, addToListLike);
router.post("/add-to-listdislike", verifyAccessToken, addToListDislike);
router.get("/all", verifyAccessToken, getAllUsersExcludingLists);
router.get("/all-user-in-listlike", verifyAccessToken, getUsersInLikeList);
router.get(
  "/all-user-in-listdislike",
  verifyAccessToken,
  getUsersInDislikeList
);
router.get("/all-user-in-listmatch", verifyAccessToken, getUsersInMatchList);
router.get("/all-user-like-me", verifyAccessToken, getUsersWhoLikedMe);
router.put("/location", verifyAccessToken, updateUserLocation);

module.exports = router;
