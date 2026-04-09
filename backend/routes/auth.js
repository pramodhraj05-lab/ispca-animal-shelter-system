const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "ispca_secret_2024";

// ── REGISTER ──────────────────────────────────────
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (row)  return res.status(409).json({ error: "Email already registered" });

    const hash = bcrypt.hashSync(password, 10);
    db.run(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,'customer')",
      [name, email, hash],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const token = jwt.sign(
          { id: this.lastID, name, email, role: "customer" },
          SECRET, { expiresIn: "7d" }
        );
        res.status(201).json({
          token,
          user: { id: this.lastID, name, email, role: "customer" }
        });
      }
    );
  });
});

// ── LOGIN ─────────────────────────────────────────
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err)   return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET, { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// ── GET ALL USERS (admin only) ────────────────────
router.get("/users", authMiddleware, adminOnly, (req, res) => {
  // COALESCE handles old DBs where name column may not exist yet
  db.all(
    "SELECT id, COALESCE(name,'') as name, email, role, created_at FROM users ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;