const User = require("../models/User");
const Resource = require("../models/Resource");
const Task = require("../models/Task");
const Node = require("../models/Node");
const Log = require("../models/Log");

async function markStaleNodes() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  await Node.updateMany(
    { lastSeen: { $lt: fiveMinAgo }, status: { $nin: ["offline"] }, isDisabled: false },
    { status: "offline" }
  );
}

async function addLog(level, category, message, meta = {}) {
  try {
    await Log.create({ level, category, message, meta });
  } catch (_) {}
}

exports.addLog = addLog;

exports.getDashboard = async (req, res) => {
  try {
    await markStaleNodes();

    const [
      totalUsers, totalResources, totalTasks, totalNodes,
      availableNodes, busyNodes, offlineNodes,
      runningTasks, completedTasks, failedTasks, pendingTasks,
      recentTasks, lowBatteryNodes, recentLogs,
      stoppedResources, availableResources, recentStoppedResources,
    ] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Task.countDocuments(),
      Node.countDocuments(),
      Node.countDocuments({ status: "available", isDisabled: false }),
      Node.countDocuments({ status: "busy" }),
      Node.countDocuments({ status: "offline" }),
      Task.countDocuments({ status: "running" }),
      Task.countDocuments({ status: "completed" }),
      Task.countDocuments({ status: "failed" }),
      Task.countDocuments({ status: "pending" }),
      Task.find().sort({ createdAt: -1 }).limit(10)
        .populate("buyer", "name email")
        .populate("assignedNode", "hostname").lean(),
      Node.find({ "battery.percent": { $lt: 15 }, status: { $ne: "offline" } }).lean(),
      Log.find().sort({ createdAt: -1 }).limit(20).lean(),
      Resource.countDocuments({ status: "stopped" }),
      Resource.countDocuments({ status: "available" }),
      Resource.find({ status: "stopped" }).sort({ updatedAt: -1 }).limit(5).populate("user", "name email").lean(),
    ]);

    const alerts = [];
    lowBatteryNodes.forEach(n => alerts.push({
      type: "battery",
      level: "warn",
      message: `Node ${n.hostname} has low battery: ${n.battery?.percent}%`,
      nodeId: String(n._id),
      ts: n.lastSeen,
    }));
    const failedTasksRecent = recentTasks.filter(t => t.status === "failed");
    failedTasksRecent.forEach(t => alerts.push({
      type: "task_failed",
      level: "error",
      message: `Task ${String(t._id).slice(-6)} failed`,
      taskId: String(t._id),
      ts: t.updatedAt,
    }));

    recentStoppedResources.forEach(r => alerts.push({
      type: "resource_stopped",
      level: "warn",
      message: `Seller listing stopped (RAM ${r.ram} GB) — ${r.user?.email || "unknown"}`,
      resourceId: String(r._id),
      ts: r.updatedAt,
    }));

    return res.json({
      totalUsers, totalResources, totalTasks, totalNodes,
      availableNodes, busyNodes, offlineNodes,
      runningTasks, completedTasks, failedTasks, pendingTasks,
      recentTasks, alerts, recentLogs,
      stoppedResources, availableResources, recentStoppedResources,
    });
  } catch (err) {
    console.error("admin dashboard error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllNodes = async (req, res) => {
  try {
    await markStaleNodes();
    const nodes = await Node.find().sort({ lastSeen: -1 }).populate("user", "name email").lean();
    return res.json(nodes);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.disableNode = async (req, res) => {
  try {
    const { nodeId, reason } = req.body || {};
    if (!nodeId) return res.status(400).json({ msg: "nodeId required" });
    const node = await Node.findByIdAndUpdate(
      nodeId,
      { isDisabled: true, status: "offline", disabledReason: reason || "Disabled by admin" },
      { new: true }
    );
    if (!node) return res.status(404).json({ msg: "Node not found" });
    await addLog("warn", "node", `Admin disabled node ${node.hostname}`, { nodeId, reason });
    return res.json({ msg: "Node disabled", node });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.enableNode = async (req, res) => {
  try {
    const { nodeId } = req.body || {};
    if (!nodeId) return res.status(400).json({ msg: "nodeId required" });
    const node = await Node.findByIdAndUpdate(
      nodeId,
      { isDisabled: false, disabledReason: "", status: "available" },
      { new: true }
    );
    if (!node) return res.status(404).json({ msg: "Node not found" });
    await addLog("info", "node", `Admin enabled node ${node.hostname}`, { nodeId });
    return res.json({ msg: "Node enabled", node });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.markNodeOffline = async (req, res) => {
  try {
    const { nodeId } = req.body || {};
    if (!nodeId) return res.status(400).json({ msg: "nodeId required" });
    const node = await Node.findByIdAndUpdate(nodeId, { status: "offline" }, { new: true });
    if (!node) return res.status(404).json({ msg: "Node not found" });
    await addLog("warn", "node", `Admin marked node ${node.hostname} offline`, { nodeId });
    return res.json({ msg: "Node marked offline", node });
  } catch {
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

exports.blockUser = async (req, res) => {
  try {
    const { userId, block } = req.body || {};
    if (!userId) return res.status(400).json({ msg: "userId required" });
    if (req.user.id === userId) return res.status(400).json({ msg: "Cannot block yourself" });
    const user = await User.findByIdAndUpdate(userId, { isBlocked: !!block }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User not found" });
    await addLog("warn", "auth", `Admin ${block ? "blocked" : "unblocked"} user ${user.email}`, { userId });
    return res.json({ msg: block ? "User blocked" : "User unblocked", user });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) return res.status(400).json({ msg: "Cannot delete yourself" });
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    await addLog("error", "auth", `Admin deleted user ${user.email}`, { userId: id });
    return res.json({ msg: "User deleted" });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body || {};
    if (!userId || !role) return res.status(400).json({ msg: "userId and role required" });
    if (!["admin", "seller", "buyer"].includes(role)) return res.status(400).json({ msg: "Invalid role" });
    if (req.user.id === userId) return res.status(400).json({ msg: "Cannot change your own role" });
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User not found" });
    await addLog("info", "auth", `Admin changed ${user.email} role to ${role}`, { userId, role });
    return res.json({ msg: "Role updated", user });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 }).populate("user", "name email").populate("stoppedBy", "name email").lean();
    const ids = resources.map(r => r._id);
    const activeTasks = await Task.find({
      assignedResource: { $in: ids },
      status: { $in: ["running", "pending"] },
    }).select("_id status assignedResource buyer requiredRam").populate("buyer", "name email").lean();
    const byResource = new Map();
    activeTasks.forEach(t => {
      const rid = String(t.assignedResource);
      if (!byResource.has(rid)) byResource.set(rid, []);
      byResource.get(rid).push(t);
    });
    const withTasks = resources.map(r => ({
      ...r,
      activeTasks: byResource.get(String(r._id)) || [],
    }));
    return res.json(withTasks);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.stopResource = async (req, res) => {
  try {
    const { resourceId, reason } = req.body || {};
    if (!resourceId) return res.status(400).json({ msg: "resourceId required" });
    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ msg: "Resource not found" });
    if (resource.status === "busy") {
      return res.status(400).json({ msg: "Cannot stop sharing while resource is assigned to an active task" });
    }
    if (resource.status === "stopped") {
      return res.status(400).json({ msg: "Resource sharing is already stopped" });
    }
    resource.status = "stopped";
    resource.stoppedReason = reason || "Stopped by admin";
    resource.stoppedBy = req.user.id;
    await resource.save();
    await addLog("warn", "resource", `Admin stopped sharing resource ${resourceId}`, { resourceId, reason });
    return res.json({ msg: "Sharing stopped", resource });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.resumeResource = async (req, res) => {
  try {
    const { resourceId } = req.body || {};
    if (!resourceId) return res.status(400).json({ msg: "resourceId required" });
    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ msg: "Resource not found" });
    if (resource.status === "busy") {
      return res.status(400).json({ msg: "Cannot resume while resource is busy" });
    }
    if (resource.status !== "stopped") {
      return res.status(400).json({ msg: "Only stopped listings can be resumed" });
    }
    resource.status = "available";
    resource.stoppedReason = "";
    resource.stoppedBy = null;
    await resource.save();
    await addLog("info", "resource", `Admin resumed sharing resource ${resourceId}`, { resourceId });
    return res.json({ msg: "Sharing resumed", resource });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ msg: "Resource not found" });
    if (resource.status === "busy") {
      return res.status(400).json({ msg: "Cannot delete while resource is assigned to an active task" });
    }
    await Resource.findByIdAndDelete(id);
    await addLog("error", "resource", `Admin deleted resource listing ${id}`, { resourceId: id });
    return res.json({ msg: "Resource deleted" });
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

exports.cancelTask = async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ msg: "taskId required" });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    if (!["running", "pending"].includes(task.status)) {
      return res.status(400).json({ msg: "Only running or pending tasks can be cancelled" });
    }
    task.status = "failed";
    task.output = (task.output || "") + "\n[Admin] Task cancelled by admin.";
    task.completedAt = new Date();
    await task.save();
    if (task.assignedResource) {
      const Resource = require("../models/Resource");
      await Resource.findByIdAndUpdate(task.assignedResource, { status: "available" });
    }
    if (task.assignedNode) {
      await Node.findByIdAndUpdate(task.assignedNode, { status: "available" });
    }
    await addLog("warn", "task", `Admin cancelled task ${taskId}`, { taskId });
    return res.json({ msg: "Task cancelled" });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.retryTask = async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ msg: "taskId required" });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    if (task.status !== "failed") return res.status(400).json({ msg: "Only failed tasks can be retried" });
    if (!task.code) return res.status(400).json({ msg: "No code stored for retry" });

    const { executeTask } = require("./taskController");
    const fakeReq = { body: { code: task.code, language: task.language, requiredRam: task.requiredRam }, user: { id: String(task.buyer) } };
    const fakeRes = {
      json: (data) => data,
      status: () => ({ json: (d) => d }),
    };
    await addLog("info", "task", `Admin retried task ${taskId}`, { taskId });
    task.status = "pending";
    task.output = "";
    await task.save();
    return res.json({ msg: "Task queued for retry", taskId });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { level, category, limit = 100 } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (category) filter.category = category;
    const logs = await Log.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    return res.json(logs);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    await markStaleNodes();
    const nodes = await Node.find({ status: { $ne: "offline" } }).lean();
    const nodeChartData = nodes.map(n => ({
      name: n.hostname || "unknown",
      cpu: Math.round((n.cpu?.usage || 0) * 100),
      ram: Math.round(n.ram?.usagePercent || 0),
      battery: Math.round(n.battery?.percent || 0),
    }));

    const now = new Date();
    const hours = [];
    for (let i = 11; i >= 0; i--) {
      const from = new Date(now.getTime() - (i + 1) * 3600000);
      const to = new Date(now.getTime() - i * 3600000);
      const label = `${String(from.getHours()).padStart(2, "0")}:00`;
      const count = await Task.countDocuments({ createdAt: { $gte: from, $lt: to } });
      const completed = await Task.countDocuments({ status: "completed", createdAt: { $gte: from, $lt: to } });
      const failed = await Task.countDocuments({ status: "failed", createdAt: { $gte: from, $lt: to } });
      hours.push({ time: label, tasks: count, completed, failed });
    }

    return res.json({ nodeChartData, tasksPerHour: hours });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = [];
    const lowBattery = await Node.find({ "battery.percent": { $lt: 15 }, status: { $ne: "offline" } }).lean();
    lowBattery.forEach(n => alerts.push({
      id: `bat-${n._id}`,
      type: "battery",
      level: "warn",
      message: `Node "${n.hostname}" battery at ${n.battery?.percent}%`,
      ts: n.lastSeen,
    }));
    const offlineRecent = await Node.find({ status: "offline", lastSeen: { $gte: new Date(Date.now() - 30 * 60 * 1000) } }).lean();
    offlineRecent.forEach(n => alerts.push({
      id: `off-${n._id}`,
      type: "offline",
      level: "error",
      message: `Node "${n.hostname}" went offline`,
      ts: n.lastSeen,
    }));
    const failedRecent = await Task.find({ status: "failed", updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } })
      .populate("buyer", "name").lean();
    failedRecent.forEach(t => alerts.push({
      id: `fail-${t._id}`,
      type: "task_failed",
      level: "error",
      message: `Task by ${t.buyer?.name || "unknown"} failed (ID: ${String(t._id).slice(-6)})`,
      ts: t.updatedAt,
    }));
    alerts.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return res.json(alerts.slice(0, 50));
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
