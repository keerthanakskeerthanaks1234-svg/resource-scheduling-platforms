const Node = require("../models/Node");

exports.registerNode = async (req, res) => {
  try {
    const { cpu, ram, battery, storage, hostname } = req.body || {};

    const batteryPercent = Number(battery?.percent ?? battery ?? 100);

    if (batteryPercent < 15) {
      return res.status(400).json({ msg: "Battery too low (<15%). Node rejected.", status: "rejected" });
    }

    const ramAvailableGB = typeof ram?.available === "string"
      ? parseFloat(ram.available)
      : Number(ram?.available ?? 0);

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

    const node = await Node.findOneAndUpdate(
      { hostname: hostname || "unknown", ipAddress: ip },
      {
        hostname: hostname || "unknown",
        cpu: {
          cores: Number(cpu?.cores ?? 0),
          usage: parseFloat(cpu?.usage ?? 0),
          model: cpu?.model || "",
        },
        ram: {
          total: typeof ram?.total === "string" ? parseFloat(ram.total) : Number(ram?.total ?? 0),
          available: ramAvailableGB,
          usagePercent: Number(ram?.usagePercent ?? 0),
        },
        battery: {
          percent: batteryPercent,
          is_charging: Boolean(battery?.is_charging ?? true),
        },
        storage: {
          total: typeof storage?.total === "string" ? parseFloat(storage.total) : Number(storage?.total ?? 0),
          available: typeof storage?.available === "string" ? parseFloat(storage.available) : Number(storage?.available ?? 0),
        },
        status: "available",
        lastSeen: new Date(),
        ipAddress: ip,
      },
      { upsert: true, new: true }
    );

    return res.json({ msg: "Node registered", nodeId: String(node._id), status: node.status });
  } catch (err) {
    console.error("registerNode error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.listNodes = async (req, res) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Node.updateMany({ lastSeen: { $lt: fiveMinAgo }, status: { $ne: "offline" } }, { status: "offline" });
    const nodes = await Node.find().sort({ lastSeen: -1 }).lean();
    return res.json(nodes);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getNodeStats = async (req, res) => {
  try {
    const total = await Node.countDocuments();
    const available = await Node.countDocuments({ status: "available" });
    const busy = await Node.countDocuments({ status: "busy" });
    const offline = await Node.countDocuments({ status: "offline" });
    return res.json({ total, available, busy, offline });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
