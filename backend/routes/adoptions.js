const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/", (req, res) => {
  db.all("SELECT * FROM adoptions", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);

  db.get("SELECT * FROM adoptions WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Adoption not found" });

    res.json(row);
  });
});
