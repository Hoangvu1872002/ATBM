const mongoose = require("mongoose");
// require("dotenv").config()

const connectDatabase = async () => {
  try {
    const databaseConfig = "mongodb://127.0.0.1/Appdating";

    const connect = await mongoose.connect(databaseConfig);

    console.log(`da ket noi mongodb: ${connect.connection.host}`);
  } catch (error) {
    console.log("chua the ket noi toi mongodb");
    console.log(error);
  }
};

module.exports = connectDatabase;
