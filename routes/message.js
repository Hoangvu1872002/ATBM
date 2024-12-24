var express = require("express");
const { getMessagesInRoom, addMessage } = require("../controllers/message");
var authRouter = express.Router();

/* GET users listing. */
authRouter.get("/get-messages-in-room", getMessagesInRoom);
authRouter.post("/add-messages", addMessage);

module.exports = authRouter;
