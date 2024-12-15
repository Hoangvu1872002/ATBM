var express = require("express");
const { register, login } = require("../controllers/auth");
var authRouter = express.Router();

/* GET users listing. */
authRouter.post("/register", register);
authRouter.post("/login", login);

module.exports = authRouter;
