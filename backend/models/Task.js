const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requiredRam: { type: Number, required: true },
    code: { type: String, default: "" },
    language: { type: String, enum: ["python", "scala"], default: "python" },
    output: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    assignedResource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", default: null },
    assignedNode: { type: mongoose.Schema.Types.ObjectId, ref: "Node", default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);

