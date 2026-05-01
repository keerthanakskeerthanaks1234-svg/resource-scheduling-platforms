const Resource = require("../models/Resource");

exports.shareResource = async (req, res) => {
  try {
    const { cpu, ram, battery } = req.body || {};

    const cpuNum = Number(cpu);
    const ramNum = Number(ram);
    const batteryNum = Number(battery);

    if (!Number.isFinite(cpuNum) || cpuNum <= 0) return res.status(400).json({ msg: "Invalid cpu" });
    if (!Number.isFinite(ramNum) || ramNum <= 0) return res.status(400).json({ msg: "Invalid ram" });
    if (!Number.isFinite(batteryNum) || batteryNum < 0 || batteryNum > 100) {
      return res.status(400).json({ msg: "Invalid battery" });
    }

    if (batteryNum < 15) {
      return res.status(400).json({ msg: "Battery too low" });
    }

    const resource = await Resource.create({
      user: req.user.id,
      cpu: cpuNum,
      ram: ramNum,
      battery: batteryNum,
    });

    return res.json(resource);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getMyResources = async (req, res) => {
  try {
    const resources = await Resource.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(resources);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAvailableResources = async (req, res) => {
  try {
    const resources = await Resource.find({ status: "available" })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .lean();
    return res.json(resources);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

