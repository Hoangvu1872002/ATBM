var express = require("express");
const { getMessagesInRoom } = require("../controllers/message");
var authRouter = express.Router();

/* GET users listing. */
authRouter.get("/get-messages-in-room", getMessagesInRoom);

module.exports = authRouter;
