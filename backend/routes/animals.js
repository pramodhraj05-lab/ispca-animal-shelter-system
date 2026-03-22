const express = require("express");
const router = express.Router();
let animals = [
  { id: 1, name: "Buddy", species: "Dog", age: 3 }
];

let idCounter = 2;
router.get("/", (req, res) => {
  res.json(animals);
});

module.exports = router;