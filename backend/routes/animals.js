const express = require("express");
const router = express.Router();
let animals = [
  { id: 1, name: "Buddy", species: "Dog", age: 3 }
];

let idCounter = 2;
router.get("/", (req, res) => {
  res.json(animals);
});

router.post("/", (req, res) => {
  res.send("POST route working");
});
const { name, species, age } = req.body;

if (!name || !species) {
  return res.status(400).json({ error: "name and species required" });
}
const newAnimal = {
  id: Date.now(),
  name,
  species,
  age
};
animals.push(newAnimal);
res.status(201).json(newAnimal);
module.exports = router;