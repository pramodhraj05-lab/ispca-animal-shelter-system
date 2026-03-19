const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, name: "Buddy", species: "Dog", age: 3 }
  ]);
});

module.exports = router;