const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hostname: { type: String, default: "unknown" },
    cpu: {
      cores: { type: Number, default: 0 },
      usage: { type: Number, default: 0 },
      model: { type: String, default: "" },
    },
    ram: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      usagePercent: { type: Number, default: 0 },
    },
    battery: {
      percent: { type: Number, default: 100 },
      is_charging: { type: Boolean, default: true },
    },
    storage: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["available", "busy", "offline", "rejected"],
      default: "available",
    },
    lastSeen: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    isDisabled: { type: Boolean, default: false },
    disabledReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Node", nodeSchema);
