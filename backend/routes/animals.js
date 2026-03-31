const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { authMiddleware, adminOnly } = require("../middleware/auth"); // Use unified auth
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── MULTER SETUP (For local image storage) ──
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ── GET ALL ANIMALS ──
router.get("/", authMiddleware, (req, res) => {
  const query = `
    SELECT a.*, s.name as shelter_name, s.location as shelter_location
    FROM animals a
    LEFT JOIN shelters s ON a.shelter_id = s.id
    ORDER BY a.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── CREATE ANIMAL (With Image Upload) ──
router.post("/", authMiddleware, adminOnly, upload.single("image"), (req, res) => {
  const { name, species, breed, age, gender, status, notes, shelter_id, image_url } = req.body;

  if (!name || !species) return res.status(400).json({ error: "Name and species required" });

  // Use uploaded file path or provided URL
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || null);

  const sql = `INSERT INTO animals (name, species, breed, age, gender, status, image, notes, shelter_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [name, species, breed, age, gender, status || 'Available', image, notes, shelter_id];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, species, image });
  });
});

// ── DELETE ANIMAL ──
router.delete("/:id", authMiddleware, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  db.run("DELETE FROM animals WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Animal not found" });
    res.json({ message: "Animal deleted", id });
  });
});

module.exports = router;