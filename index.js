const express = require("express");
const mongoose = require("mongoose");
const connectToMongoDB = require("./connect");
const registerRoute = require("./route/register");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = 5000;

app.use(express.json());

connectToMongoDB(
  "mongodb+srv://blog-crud:9503904mma@projects.wtj81.mongodb.net/?retryWrites=true&w=majority&appName=Projects/evox"
)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

app.use("/api", registerRoute);

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
