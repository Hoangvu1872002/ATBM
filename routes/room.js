var express = require("express");
const {
  getAllRooms,
  removeRoomFromUser,
  addRoom,
} = require("../controllers/room");
var authRouter = express.Router();

/* GET users listing. */
authRouter.get("/get-all-room", getAllRooms);
authRouter.post("/remove-room", removeRoomFromUser);
authRouter.post("/add-room", addRoom);

module.exports = authRouter;
