const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { authMiddleware } = require("../middleware/auth");

// ── GET ALL ADOPTIONS ─────────────────────────────
router.get("/", authMiddleware, (req, res) => {
  const query = `
    SELECT ad.*, a.name as animal_name, a.species as animal_species, a.image as animal_image
    FROM adoptions ad
    LEFT JOIN animals a ON ad.animal_id = a.id
    ORDER BY ad.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── CREATE ADOPTION REQUEST ───────────────────────
router.post("/", authMiddleware, (req, res) => {
  const { animal_id, adopter_name, adoption_date, adopter_email, adopter_phone, notes } = req.body;

  const sql = `INSERT INTO adoptions (animal_id, adopter_name, adoption_date, adopter_email, adopter_phone, notes) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [animal_id, adopter_name, adoption_date, adopter_email, adopter_phone, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...req.body });
  });
});

// ── UPDATE STATUS (Admin Only) ────────────────────
router.put("/:id", authMiddleware, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });

  const id = parseInt(req.params.id);
  const { status } = req.body;

  db.run("UPDATE adoptions SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // If approved, automatically update the animal's status
    if (status === "Approved") {
      db.run("UPDATE animals SET status = 'Adopted' WHERE id = (SELECT animal_id FROM adoptions WHERE id = ?)", [id]);
    }
    
    res.json({ message: "Status updated", id });
  });
});

module.exports = router;