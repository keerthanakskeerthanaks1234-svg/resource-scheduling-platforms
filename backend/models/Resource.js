const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cpu: { type: Number, required: true },
    ram: { type: Number, required: true },
    battery: { type: Number, required: true },
    status: { type: String, enum: ["available", "busy", "stopped"], default: "available" },
    stoppedReason: { type: String, default: "" },
    stoppedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);

