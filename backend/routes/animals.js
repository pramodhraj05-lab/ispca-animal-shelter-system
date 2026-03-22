const express = require("express");
const router = express.Router();
const db = require("../db/database");

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
  db.all("SELECT * FROM animals", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
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
  const id = parseInt(req.params.id);

  const animal = animals.find(a => a.id === id);

  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }

  const { name, species, age } = req.body;

  if (name) animal.name = name;
  if (species) animal.species = species;
  if (age !== undefined) animal.age = age;

  res.json(animal);
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const index = animals.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Animal not found" });
  }

  const deletedAnimal = animals.splice(index, 1);
  res.json(deletedAnimal[0]);
});

module.exports = router;