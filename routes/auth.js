var express = require("express");
const {
  register,
  login,
  checkSession,
  logout,
} = require("../controllers/auth");
var authRouter = express.Router();

const { verifyAccessToken } = require("../middlewares/verifyToken");

/* GET users listing. */
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/check-session", checkSession);
authRouter.post("/logout", verifyAccessToken, logout);

module.exports = authRouter;
