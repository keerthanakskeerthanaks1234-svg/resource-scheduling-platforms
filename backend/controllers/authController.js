const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ROLES = new Set(["seller", "buyer", "admin"]);

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ msg: "Name is required" });
    }
    if (!isValidEmail(email)) return res.status(400).json({ msg: "Valid email is required" });
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const normalizedRole = role && ROLES.has(role) ? role : "buyer";
    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) return res.status(409).json({ msg: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.json({
      user: user.toSafeJSON(),
      token,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ msg: "Valid email is required" });
    if (!password || typeof password !== "string") {
      return res.status(400).json({ msg: "Password is required" });
    }

    const found = await User.findOne({ email: String(email).toLowerCase() });
    if (!found) return res.status(400).json({ msg: "Invalid email or password" });

    const match = await bcrypt.compare(password, found.passwordHash);
    if (!match) return res.status(400).json({ msg: "Invalid email or password" });

    const token = jwt.sign(
      { sub: String(found._id), role: found.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.json({
      id: String(found._id),
      role: found.role,
      email: found.email,
      name: found.name,
      token,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

