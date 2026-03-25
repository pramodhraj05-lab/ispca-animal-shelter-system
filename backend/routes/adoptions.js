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

router.post("/", (req, res) => {
  const { animal_id, adopter_name, adoption_date } = req.body;

  db.run(
    "INSERT INTO adoptions (animal_id, adopter_name, adoption_date) VALUES (?, ?, ?)",
    [animal_id, adopter_name, adoption_date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        animal_id,
        adopter_name,
        adoption_date
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { animal_id, adopter_name, adoption_date } = req.body;

  db.run(
    "UPDATE adoptions SET animal_id = ?, adopter_name = ?, adoption_date = ? WHERE id = ?",
    [animal_id, adopter_name, adoption_date, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Adoption not found" });
      }

      res.json({ id, animal_id, adopter_name, adoption_date });
    }
  );
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);

  db.run(
    "DELETE FROM adoptions WHERE id = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Adoption not found" });
      }

      res.json({ message: "Adoption deleted", id });
    }
  );
});

module.exports = router;