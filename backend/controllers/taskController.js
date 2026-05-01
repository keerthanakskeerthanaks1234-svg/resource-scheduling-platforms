const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const Resource = require("../models/Resource");
const Task = require("../models/Task");
const Node = require("../models/Node");

const EXECUTION_TIMEOUT_MS = 30000;

function runPythonCode(code) {
  return new Promise((resolve) => {
    const tmpFile = path.join(os.tmpdir(), "task_" + Date.now() + "_" + Math.random().toString(36).slice(2) + ".py");
    fs.writeFileSync(tmpFile, code, "utf8");

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn("python3", [tmpFile], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, EXECUTION_TIMEOUT_MS);

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      if (timedOut) {
        resolve({ success: false, output: "Execution timed out (30s limit)." });
      } else if (exitCode !== 0) {
        resolve({ success: false, output: stderr || "Process exited with code " + exitCode });
      } else {
        resolve({ success: true, output: stdout || "(no output)" });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve({ success: false, output: "Execution error: " + err.message });
    });
  });
}

exports.executeTask = async (req, res) => {
  try {
    const { code, language, requiredRam } = req.body || {};

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ msg: "No code provided" });
    }

    const lang = language === "scala" ? "scala" : "python";
    const ramNeeded = Math.max(1, Number(requiredRam) || 1);

    const node = await Node.findOne({
      status: "available",
      "battery.percent": { $gte: 15 },
      "ram.available": { $gte: ramNeeded },
    }).sort({ "ram.available": -1 });

    const resource = await Resource.findOne({
      status: "available",
      ram: { $gte: ramNeeded },
      battery: { $gte: 15 },
    }).sort({ createdAt: 1 });

    const task = await Task.create({
      buyer: req.user.id,
      requiredRam: ramNeeded,
      code: code.trim(),
      language: lang,
      status: "running",
      assignedResource: resource ? resource._id : null,
      assignedNode: node ? node._id : null,
      startedAt: new Date(),
    });

    if (resource) { resource.status = "busy"; await resource.save(); }
    if (node) { node.status = "busy"; await node.save(); }

    let result;
    if (lang === "python") {
      result = await runPythonCode(code.trim());
    } else {
      result = { success: false, output: "Scala execution not supported. Use Python." };
    }

    task.output = result.output;
    task.status = result.success ? "completed" : "failed";
    task.completedAt = new Date();
    await task.save();

    if (resource) { resource.status = "available"; await resource.save(); }
    if (node) { node.status = "available"; await node.save(); }

    return res.json({
      taskId: String(task._id),
      status: task.status,
      output: task.output,
      language: lang,
      executedOn: node ? node.hostname : (resource ? "shared-resource" : "local-executor"),
    });
  } catch (err) {
    console.error("executeTask error:", err);
    return res.status(500).json({ msg: "Server error during execution" });
  }
};

exports.requestResource = async (req, res) => {
  try {
    const { requiredRam } = req.body || {};
    const required = Number(requiredRam);
    if (!Number.isFinite(required) || required <= 0) {
      return res.status(400).json({ msg: "Invalid requiredRam" });
    }

    const resource = await Resource.findOne({
      ram: { $gte: required },
      status: "available",
      battery: { $gte: 15 },
    }).sort({ createdAt: 1 });
    if (!resource) return res.status(404).json({ msg: "No resource available" });

    resource.status = "busy";
    await resource.save();

    const task = await Task.create({
      buyer: req.user.id,
      requiredRam: required,
      assignedResource: resource._id,
      status: "running",
      startedAt: new Date(),
    });

    return res.json(task);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ buyer: req.user.id })
      .sort({ createdAt: -1 })
      .populate("assignedResource")
      .populate("assignedNode", "hostname cpu ram")
      .lean();
    return res.json(tasks);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, buyer: req.user.id })
      .populate("assignedResource")
      .populate("assignedNode", "hostname cpu ram")
      .lean();
    if (!task) return res.status(404).json({ msg: "Task not found" });
    return res.json(task);
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
