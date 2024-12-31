var express = require("express");
const {
  register,
  login,
  checkSession,
  logout,
} = require("../controllers/auth");
var authRouter = express.Router();

/* GET users listing. */
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/check-session", checkSession);
authRouter.post("/logout", logout);

module.exports = authRouter;
