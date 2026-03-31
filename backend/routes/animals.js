const express = require("express");
const router = express.Router();
const db = require("../db/database");
const verifyToken = require("../middleware/authMiddleware"); //

// ── GET ALL ANIMALS ────────────────────────────────
// Added verifyToken to protect the data
router.get("/", verifyToken, (req, res) => { 
  // Updated query to include status and shelter info for the dashboard
  const query = `
    SELECT a.*, s.name as shelter_name 
    FROM animals a 
    LEFT JOIN shelters s ON a.shelter_id = s.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── GET ONE ANIMAL ─────────────────────────────────
router.get("/:id", verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT * FROM animals WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Animal not found" });
    res.json(row);
  });
});

// ── CREATE ANIMAL ──────────────────────────────────
router.post("/", verifyToken, (req, res) => {
  // Destructured new fields: status, notes, and shelter_id
  const { name, species, age, image, status, notes, shelter_id } = req.body;

  if (!name || !species) {
    return res.status(400).json({ error: "name and species required" });
  }

  const sql = `INSERT INTO animals (name, species, age, image, status, notes, shelter_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [name, species, age, image, status || 'Available', notes, shelter_id];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...req.body });
  });
});

// ── UPDATE ANIMAL ──────────────────────────────────
router.put("/:id", verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, species, age, status, notes, shelter_id } = req.body;

  const sql = `UPDATE animals SET name = ?, species = ?, age = ?, status = ?, notes = ?, shelter_id = ? 
               WHERE id = ?`;
  
  db.run(sql, [name, species, age, status, notes, shelter_id, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Animal not found" });
    res.json({ message: "Update successful", id });
  });
});

// ── DELETE ANIMAL ──────────────────────────────────
router.delete("/:id", verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.run("DELETE FROM animals WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Animal not found" });
    res.json({ message: "Animal deleted successfully", id });
  });
});

module.exports = router;