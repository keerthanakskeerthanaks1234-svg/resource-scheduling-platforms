const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { spawn } = require("node:child_process");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
let agentProcess = null;

function startAgentProcess() {
  const pythonBin = process.env.PYTHON_BIN || "python";
  const agentPath = path.join(__dirname, "agent.py");
  agentProcess = spawn(pythonBin, [agentPath], {
    cwd: __dirname,
    env: { ...process.env, AGENT_PORT: process.env.AGENT_PORT || "5001" },
    stdio: "inherit",
  });

  agentProcess.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start agent.py:", err.message);
  });
}

connectDB().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
startAgentProcess();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/system-resources", async (req, res) => {
  try {
    const agentPort = process.env.AGENT_PORT || "5001";
    const response = await fetch(`http://127.0.0.1:${agentPort}/api/system-resources`);
    const data = await response.json();
    return res.json(data);
  } catch {
    return res.status(503).json({ msg: "Agent service unavailable" });
  }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/resource", require("./routes/resourceRoutes"));
app.use("/api/task", require("./routes/taskRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/node", require("./routes/nodeRoutes"));

app.use((req, res) => res.status(404).json({ msg: "Not found" }));

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));

function shutdown() {
  if (agentProcess && !agentProcess.killed) {
    agentProcess.kill();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

