const os = require("node:os");

function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus()?.length || 0,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    uptimeSeconds: os.uptime(),
    hostname: os.hostname(),
  };
}

module.exports = { getSystemInfo };

