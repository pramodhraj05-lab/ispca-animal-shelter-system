const express = require("express");
const router = express.Router();
const db = require("../db/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ SAME SECRET as middleware
const SECRET = process.env.JWT_SECRET || "pawhaven_secret_2024";

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashed = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashed, "customer"],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      // create token immediately
      const token = jwt.sign(
        { id: this.lastID, name, email, role: "customer" },
        SECRET
      );

      res.status(201).json({
        token,
        user: {
          id: this.lastID,
          name,
          email,
          role: "customer"
        }
      });
    }
  );
});

// GET /auth/users - admin only
router.get("/users", authMiddleware, adminOnly, (req, res) => {
  db.all("SELECT id, name, email, role, created_at FROM users ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      SECRET
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;