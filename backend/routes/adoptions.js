const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const JOIN = `
  SELECT ad.*,
         a.name    AS animal_name,
         a.species AS animal_species,
         a.image   AS animal_image
  FROM adoptions ad
  LEFT JOIN animals a ON ad.animal_id = a.id
`;

// ── TRACK BY EMAIL OR ID (public — no auth needed) ──
// GET /adoptions/track?email=x  OR  /adoptions/track?id=5
router.get("/track", (req, res) => {
  const { email, id } = req.query;

  if (!email && !id) {
    return res.status(400).json({ error: "Provide email or id to track" });
  }

  let sql, params;
  if (id) {
    sql    = JOIN + " WHERE ad.id = ?";
    params = [parseInt(id)];
  } else {
    sql    = JOIN + " WHERE LOWER(ad.adopter_email) = LOWER(?)";
    params = [email.trim()];
  }

  db.all(sql, params, (err, rows) => {
    if (err)          return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: "No adoption request found" });
    res.json(rows);
  });
});

// ── GET ALL ───────────────────────────────────────
router.get("/", authMiddleware, (req, res) => {
  db.all(JOIN + " ORDER BY ad.created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── GET ONE ───────────────────────────────────────
router.get("/:id", authMiddleware, (req, res) => {
  db.get(JOIN + " WHERE ad.id = ?", [parseInt(req.params.id)], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Adoption not found" });
    res.json(row);
  });
});

// ── CREATE (any logged-in user) ───────────────────
router.post("/", authMiddleware, (req, res) => {
  const { animal_id, adopter_name, adopter_email, adopter_phone, adoption_date, notes } = req.body;

  if (!animal_id || !adopter_name) {
    return res.status(400).json({ error: "animal_id and adopter_name required" });
  }

  // Check animal exists & is available
  db.get("SELECT status FROM animals WHERE id = ?", [animal_id], (err, animal) => {
    if (err)     return res.status(500).json({ error: err.message });
    if (!animal) return res.status(404).json({ error: "Animal not found" });
    if (animal.status === "Adopted") {
      return res.status(400).json({ error: "This animal has already been adopted" });
    }

    db.run(
      `INSERT INTO adoptions
         (animal_id,adopter_name,adopter_email,adopter_phone,adoption_date,notes,status)
       VALUES (?,?,?,?,?,?,'Pending')`,
      [animal_id, adopter_name, adopter_email||null, adopter_phone||null,
       adoption_date||null, notes||null],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id: this.lastID,
          animal_id, adopter_name, adopter_email,
          status: "Pending",
          message: `Request submitted! Track using ID: ${this.lastID} or your email.`
        });
      }
    );
  });
});

// ── UPDATE STATUS (admin only) ────────────────────
router.put("/:id", authMiddleware, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  db.get("SELECT * FROM adoptions WHERE id = ?", [id], (err, existing) => {
    if (err)       return res.status(500).json({ error: err.message });
    if (!existing) return res.status(404).json({ error: "Adoption not found" });

    db.run(
      "UPDATE adoptions SET status=?, notes=? WHERE id=?",
      [status || existing.status,
       notes !== undefined ? notes : existing.notes,
       id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Auto-mark animal as Adopted when approved
        if (status === "Approved") {
          db.run("UPDATE animals SET status='Adopted' WHERE id=?", [existing.animal_id]);
        }
        // Revert animal status if rejection
        if (status === "Rejected") {
          db.run(
            "UPDATE animals SET status='Available' WHERE id=? AND status='Adopted'",
            [existing.animal_id]
          );
        }

        res.json({ id, status, message: "Status updated" });
      }
    );
  });
});

// ── DELETE (admin only) ───────────────────────────
router.delete("/:id", authMiddleware, adminOnly, (req, res) => {
  db.run("DELETE FROM adoptions WHERE id = ?", [parseInt(req.params.id)], function(err) {
    if (err)           return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Adoption not found" });
    res.json({ message: "Adoption deleted", id: parseInt(req.params.id) });
  });
});

module.exports = router;
