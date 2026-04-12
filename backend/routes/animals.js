const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── MULTER IMAGE UPLOAD ───────────────────────────
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uid = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uid + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error("Images only"));
  }
});

// ── GET ALL ───────────────────────────────────────
router.get("/", authMiddleware, (req, res) => {
  const sql = `
    SELECT a.*, s.name AS shelter_name, s.location AS shelter_location
    FROM animals a
    LEFT JOIN shelters s ON a.shelter_id = s.id
    ORDER BY a.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── GET ONE ───────────────────────────────────────
router.get("/:id", authMiddleware, (req, res) => {
  const sql = `
    SELECT a.*, s.name AS shelter_name
    FROM animals a
    LEFT JOIN shelters s ON a.shelter_id = s.id
    WHERE a.id = ?
  `;
  db.get(sql, [parseInt(req.params.id)], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Animal not found" });
    res.json(row);
  });
});

// ── CREATE ────────────────────────────────────────
router.post("/", authMiddleware, adminOnly, upload.single("image"), (req, res) => {
  const { name, species, breed, age, gender, status, notes, shelter_id, image_url } = req.body;
  if (!name || !species) return res.status(400).json({ error: "name and species required" });

  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || null);
  const params = [name, species, breed || null, age || null, gender || null,
    status || "Available", image, notes || null, shelter_id || null];

  db.run(
    `INSERT INTO animals (name,species,breed,age,gender,status,image,notes,shelter_id)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    params,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, species, image });
    }
  );
});

// ── UPDATE ────────────────────────────────────────  ← was missing
router.put("/:id", authMiddleware, adminOnly, upload.single("image"), (req, res) => {
  const id = parseInt(req.params.id);
  const { name, species, breed, age, gender, status, notes, shelter_id, image_url } = req.body;

  db.get("SELECT * FROM animals WHERE id = ?", [id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existing) return res.status(404).json({ error: "Animal not found" });

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : (image_url !== undefined ? (image_url || null) : existing.image);

    db.run(
      `UPDATE animals
       SET name=?, species=?, breed=?, age=?, gender=?, status=?, image=?, notes=?, shelter_id=?
       WHERE id=?`,
      [name || existing.name,
      species || existing.species,
      breed !== undefined ? breed : existing.breed,
      age !== undefined ? age : existing.age,
      gender !== undefined ? gender : existing.gender,
      status || existing.status,
        image,
      notes !== undefined ? notes : existing.notes,
      shelter_id !== undefined ? shelter_id : existing.shelter_id,
        id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (!this.changes) return res.status(404).json({ error: "Animal not found" });
        res.json({ id, message: "Animal updated" });
      }
    );
  });
});

// ── DELETE ────────────────────────────────────────
router.delete("/:id", authMiddleware, adminOnly, (req, res) => {
  db.run("DELETE FROM animals WHERE id = ?", [parseInt(req.params.id)], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Animal not found" });
    res.json({ message: "Animal deleted", id: parseInt(req.params.id) });
  });
});

module.exports = router;
