const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI in environment");
  }

  if (String(process.env.MONGOOSE_DEBUG).toLowerCase() === "true") {
    mongoose.set("debug", true);
  }

  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
}

module.exports = connectDB;

