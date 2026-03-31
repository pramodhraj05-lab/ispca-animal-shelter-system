const express = require("express");
const router = express.Router();
const db = require("../db/database");
const verifyToken = require("../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  const query = `
    SELECT s.*, COUNT(a.id) as animal_count
    FROM shelters s
    LEFT JOIN animals a ON a.shelter_id = s.id
    GROUP BY s.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/", verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
  
  const { name, location, phone, email, capacity } = req.body;
  db.run(
    "INSERT INTO shelters (name, location, phone, email, capacity) VALUES (?, ?, ?, ?, ?)",
    [name, location, phone, email, capacity],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name });
    }
  );
});

module.exports = router;