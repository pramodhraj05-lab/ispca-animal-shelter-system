const express = require("express");
const router = express.Router();
const db = require("../db/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = "secretkey";

// Register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body; // Added name

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashed = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashed, "customer"], // Default role is customer
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      // Create token immediately so user is logged in
      const token = jwt.sign({ id: this.lastID, name, email, role: "customer" }, SECRET);
      
      res.status(201).json({ 
        token, 
        user: { id: this.lastID, name, email, role: "customer" } 
      });
    }
  );
});