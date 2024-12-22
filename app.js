var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authsRouter = require("./routes/auth");
var messRouter = require("./routes/message");
var roomRouter = require("./routes/room");

const { errorsMiddleware } = require("./middlewares/errorsMiddleware");
const dbConnect = require("./config/database");
var cors = require("cors");

require("dotenv").config();

dbConnect();

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors({}));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auths", authsRouter);
app.use("/users", usersRouter);
app.use("/mess", messRouter);
app.use("/rooms", roomRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(errorsMiddleware);

const PORT = process.env.PORT;
const http = require("http");
const server = http
  .createServer(app)
  .listen(PORT, () => console.log(`Server running on port ${PORT}`));

const socketIO = require("socket.io");
const { handleSocketEvents } = require("./controllers/socket");
// const driverModel = require("./models/driverModel");
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("connected");

  handleSocketEvents(io, socket); // Gọi hàm xử lý từ file `socketHandlers.js`
});

module.exports = app;
