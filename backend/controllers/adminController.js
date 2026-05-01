const User = require("../models/User");
const Resource = require("../models/Resource");
const Task = require("../models/Task");
const Node = require("../models/Node");

exports.getDashboard = async (req, res) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Node.updateMany({ lastSeen: { $lt: fiveMinAgo }, status: { $ne: "offline" } }, { status: "offline" });

    const [totalUsers, totalResources, totalTasks, totalNodes, availableNodes, busyNodes, runningTasks, completedTasks, failedTasks, recentTasks] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Task.countDocuments(),
      Node.countDocuments(),
      Node.countDocuments({ status: "available" }),
      Node.countDocuments({ status: "busy" }),
      Task.countDocuments({ status: "running" }),
      Task.countDocuments({ status: "completed" }),
      Task.countDocuments({ status: "failed" }),
      Task.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("buyer", "name email")
        .populate("assignedNode", "hostname")
        .lean(),
    ]);

    return res.json({
      totalUsers,
      totalResources,
      totalTasks,
      totalNodes,
      availableNodes,
      busyNodes,
      runningTasks,
      completedTasks,
      failedTasks,
      recentTasks,
    });
  } catch (err) {
    console.error("admin dashboard error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate("buyer", "name email")
      .populate("assignedResource", "cpu ram battery")
      .populate("assignedNode", "hostname cpu ram")
      .lean();
    return res.json(tasks);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
