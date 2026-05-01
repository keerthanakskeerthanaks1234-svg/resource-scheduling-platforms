const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ msg: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ msg: "Invalid token user" });
    if (user.isBlocked) return res.status(403).json({ msg: "Account blocked. Contact admin." });
    req.user = { id: String(user._id), role: user.role, email: user.email, name: user.name };
    return next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ msg: "Forbidden" });
    return next();
  };
}

module.exports = {
  authRequired,
  requireRole,
};

