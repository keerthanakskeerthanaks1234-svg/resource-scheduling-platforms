const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    category: {
      type: String,
      enum: ["task", "node", "auth", "system", "error"],
      default: "system",
    },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
