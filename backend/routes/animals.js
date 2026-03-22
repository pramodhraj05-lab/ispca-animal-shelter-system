const express = require("express");
const router = express.Router();

let animals = [
  { id: 1, name: "Buddy", species: "Dog", age: 3 }
];
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const animal = animals.find(a => a.id === id);

  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }

  res.json(animal);
});

router.get("/", (req, res) => {
  res.json(animals);
});

router.post("/", (req, res) => {
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
});

router.put("/:id", (req, res) => {
  res.send("working");
});
const id = parseInt(req.params.id);
const animal = animals.find(a => a.id === id);

module.exports = router;