const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const { authMiddleware, adminOnly } = require("../middleware/auth");

// ── GET ALL (with animal count + capacity) ────────
router.get("/", authMiddleware, (req, res) => {
  const sql = `
    SELECT s.*,
           COUNT(a.id) AS animal_count
    FROM shelters s
    LEFT JOIN animals a ON a.shelter_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── GET ONE ───────────────────────────────────────
router.get("/:id", authMiddleware, (req, res) => {
  db.get("SELECT * FROM shelters WHERE id = ?", [parseInt(req.params.id)], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Shelter not found" });
    res.json(row);
  });
});

// ── CREATE ────────────────────────────────────────
router.post("/", authMiddleware, adminOnly, (req, res) => {
  const { name, location, phone, email, capacity } = req.body;
  if (!name || !location) return res.status(400).json({ error: "name and location required" });

  db.run(
    "INSERT INTO shelters (name,location,phone,email,capacity) VALUES (?,?,?,?,?)",
    [name, location, phone||null, email||null, capacity||50],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, location });
    }
  );
});

// ── UPDATE ────────────────────────────────────────  ← was missing
router.put("/:id", authMiddleware, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, location, phone, email, capacity } = req.body;

  db.get("SELECT * FROM shelters WHERE id = ?", [id], (err, existing) => {
    if (err)       return res.status(500).json({ error: err.message });
    if (!existing) return res.status(404).json({ error: "Shelter not found" });

    db.run(
      "UPDATE shelters SET name=?,location=?,phone=?,email=?,capacity=? WHERE id=?",
      [name     || existing.name,
       location || existing.location,
       phone    !== undefined ? phone    : existing.phone,
       email    !== undefined ? email    : existing.email,
       capacity !== undefined ? capacity : existing.capacity,
       id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, message: "Shelter updated" });
      }
    );
  });
});

// ── DELETE ────────────────────────────────────────  ← was missing
router.delete("/:id", authMiddleware, adminOnly, (req, res) => {
  db.run("DELETE FROM shelters WHERE id = ?", [parseInt(req.params.id)], function(err) {
    if (err)           return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Shelter not found" });
    res.json({ message: "Shelter deleted", id: parseInt(req.params.id) });
  });
});

module.exports = router;
