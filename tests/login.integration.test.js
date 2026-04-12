/**
 * INTEGRATION TEST — POST /auth/login
 * Spins up Express with an in-memory SQLite DB and tests the full login flow.
 */

const request = require("supertest");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

const SECRET = "ispca_secret_2024";

let app;
let testDb;

beforeAll((done) => {
  testDb = new sqlite3.Database(":memory:", (err) => {
    if (err) return done(err);

    testDb.serialize(() => {
      testDb.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL DEFAULT '',
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'customer'
        )
      `);

      const hash = bcrypt.hashSync("password123", 10);
      testDb.run(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Test User", "user@ispca.ie", hash, "customer"],
        () => { app = buildApp(testDb); done(); }
      );
    });
  });
});

afterAll(() => new Promise((resolve) => testDb.close(resolve)));

function buildApp(db) {
  const app    = express();
  const router = express.Router();
  app.use(express.json());

  router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err || !user) return res.status(401).json({ error: "Invalid email or password" });
      if (!bcrypt.compareSync(password, user.password))
        return res.status(401).json({ error: "Invalid email or password" });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET, { expiresIn: "7d" }
      );
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    });
  });

  app.use("/auth", router);
  return app;
}

describe("POST /auth/login — Integration", () => {
  test("returns 200 with a valid JWT token for correct credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@ispca.ie", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("user@ispca.ie");

    const decoded = jwt.verify(res.body.token, SECRET);
    expect(decoded.email).toBe("user@ispca.ie");
  });
});
