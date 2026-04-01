const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const bcrypt  = require("bcryptjs");

const dbPath = path.join(__dirname, "animals.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection failed:", err);
  else     console.log("✅ Connected to SQLite");
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  // ── USERS  (name column was missing in old version) ──
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL DEFAULT '',
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    role       TEXT    DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── SHELTERS ──────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS shelters (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    location   TEXT    NOT NULL,
    phone      TEXT,
    email      TEXT,
    capacity   INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── ANIMALS ───────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS animals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    species    TEXT    NOT NULL,
    breed      TEXT,
    age        INTEGER,
    gender     TEXT,
    status     TEXT    DEFAULT 'Available',
    image      TEXT,
    notes      TEXT,
    shelter_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shelter_id) REFERENCES shelters(id)
  )`);

  // ── ADOPTIONS ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS adoptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id     INTEGER,
    user_id       INTEGER,
    adopter_name  TEXT,
    adopter_email TEXT,
    adopter_phone TEXT,
    status        TEXT    DEFAULT 'Pending',
    notes         TEXT,
    adoption_date TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id)
  )`);

  // ── SEED ADMIN ACCOUNT ────────────────────────────────
  db.get("SELECT id FROM users WHERE email = 'admin@ispca.ie'", [], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync("admin123", 10);
      db.run(
        "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
        ["Admin", "admin@ispca.ie", hash, "admin"],
        () => console.log("🔑 Admin created → admin@ispca.ie / admin123")
      );
    }
  });

  // ── SEED SHELTERS + ANIMALS (only if DB is empty) ─────
  db.get("SELECT COUNT(*) as c FROM shelters", [], (err, row) => {
    if (err || row.c > 0) return;   // already seeded

    const shelters = [
      { name:"ISPCA Dublin Centre",   location:"Dublin, Ireland",   phone:"01 497 7874",  email:"dublin@ispca.ie",   capacity:60 },
      { name:"ISPCA Cork Shelter",    location:"Cork, Ireland",     phone:"021 497 1200", email:"cork@ispca.ie",     capacity:40 },
      { name:"ISPCA Galway Branch",   location:"Galway, Ireland",   phone:"091 777 400",  email:"galway@ispca.ie",   capacity:35 },
      { name:"ISPCA Limerick Centre", location:"Limerick, Ireland", phone:"061 312 434",  email:"limerick@ispca.ie", capacity:30 },
    ];

    let done = 0;
    const ids = {};
    shelters.forEach((s, i) => {
      db.run(
        "INSERT INTO shelters (name,location,phone,email,capacity) VALUES (?,?,?,?,?)",
        [s.name, s.location, s.phone, s.email, s.capacity],
        function(err) {
          if (!err) ids[i] = this.lastID;
          if (++done === shelters.length) seedAnimals(ids);
        }
      );
    });
  });
});

// ── 35 DUMMY ANIMALS ─────────────────────────────────────
function seedAnimals(ids) {
  const dog = [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1534361960057-19f4434a8ed8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1490889609481-1c79a5f49059?w=400&h=300&fit=crop",
  ];
  const cat = [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495360010541-f48722b35f7d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1536590158209-e9d615d525e4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1552944150-6dd1180e5999?w=400&h=300&fit=crop",
  ];

  const animals = [
    // ── DOGS (20) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    { name:"Buddy",   species:"Dog", breed:"Labrador Retriever",    age:3, gender:"Male",   status:"Available",   img:dog[0],  notes:"Friendly and great with kids. Loves fetch.",                  s:0 },
    { name:"Max",     species:"Dog", breed:"German Shepherd",       age:5, gender:"Male",   status:"Available",   img:dog[1],  notes:"Loyal and intelligent. Needs experienced owner.",             s:0 },
    { name:"Bella",   species:"Dog", breed:"Golden Retriever",      age:2, gender:"Female", status:"Available",   img:dog[2],  notes:"Playful and affectionate. Perfect family dog.",               s:0 },
    { name:"Charlie", species:"Dog", breed:"Beagle",                age:4, gender:"Male",   status:"Adopted",     img:dog[3],  notes:"Curious and merry. Loves sniffing adventures.",              s:0 },
    { name:"Luna",    species:"Dog", breed:"Border Collie",         age:1, gender:"Female", status:"Available",   img:dog[4],  notes:"Extremely smart and energetic. Needs daily exercise.",       s:1 },
    { name:"Rocky",   species:"Dog", breed:"Staffordshire Bull",    age:6, gender:"Male",   status:"Available",   img:dog[5],  notes:"Big softy. Loves children and belly rubs.",                  s:1 },
    { name:"Daisy",   species:"Dog", breed:"Cocker Spaniel",        age:3, gender:"Female", status:"Available",   img:dog[6],  notes:"Gentle and cheerful. Loves ear scratches.",                  s:1 },
    { name:"Cooper",  species:"Dog", breed:"Boxer",                 age:4, gender:"Male",   status:"Medical Hold",img:dog[7],  notes:"Recovering from minor surgery. Available soon.",             s:1 },
    { name:"Sadie",   species:"Dog", breed:"Dachshund",             age:2, gender:"Female", status:"Available",   img:dog[8],  notes:"Small but feisty. Full of personality.",                     s:2 },
    { name:"Duke",    species:"Dog", breed:"Rottweiler",            age:7, gender:"Male",   status:"Available",   img:dog[9],  notes:"Calm senior dog. Needs a quiet home.",                       s:2 },
    { name:"Molly",   species:"Dog", breed:"Cavalier King Charles", age:3, gender:"Female", status:"Available",   img:dog[10], notes:"Sweet and gentle. Loves lap time.",                          s:2 },
    { name:"Bear",    species:"Dog", breed:"Siberian Husky",        age:2, gender:"Male",   status:"Available",   img:dog[11], notes:"Vocal and energetic. Loves cold and open spaces.",           s:2 },
    { name:"Rosie",   species:"Dog", breed:"Poodle",                age:4, gender:"Female", status:"Adopted",     img:dog[12], notes:"Hypoallergenic. Very clean and smart.",                      s:3 },
    { name:"Tucker",  species:"Dog", breed:"Australian Shepherd",   age:3, gender:"Male",   status:"Available",   img:dog[13], notes:"Herding instincts. Needs yard and active owners.",           s:3 },
    { name:"Lola",    species:"Dog", breed:"French Bulldog",        age:2, gender:"Female", status:"Available",   img:dog[14], notes:"Compact and charming. Great for apartment living.",          s:3 },
    { name:"Bruno",   species:"Dog", breed:"Dobermann",             age:5, gender:"Male",   status:"Available",   img:dog[15], notes:"Protective and loyal. Experienced owners preferred.",        s:3 },
    { name:"Penny",   species:"Dog", breed:"Jack Russell Terrier",  age:1, gender:"Female", status:"Available",   img:dog[16], notes:"Tiny and full of energy. Loves toys and playtime.",          s:0 },
    { name:"Zeus",    species:"Dog", breed:"Great Dane",            age:3, gender:"Male",   status:"Available",   img:dog[17], notes:"Gentle giant. Surprisingly calm indoors.",                   s:1 },
    { name:"Nala",    species:"Dog", breed:"Whippet",               age:2, gender:"Female", status:"Available",   img:dog[18], notes:"Graceful and fast. Very affectionate at home.",              s:2 },
    { name:"Rex",     species:"Dog", breed:"Irish Terrier",         age:4, gender:"Male",   status:"Available",   img:dog[19], notes:"Lively Irish breed. Bold and dashing.",                     s:3 },
    // ── CATS (15) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    { name:"Whiskers",species:"Cat", breed:"Domestic Shorthair",    age:4, gender:"Male",   status:"Available",   img:cat[0],  notes:"Independent and curious. Good for home workers.",            s:0 },
    { name:"Mittens", species:"Cat", breed:"Ragdoll",               age:2, gender:"Female", status:"Available",   img:cat[1],  notes:"Floppy and affectionate. Loves being carried.",              s:0 },
    { name:"Shadow",  species:"Cat", breed:"British Shorthair",     age:6, gender:"Male",   status:"Available",   img:cat[2],  notes:"Chilled and stoic. Prefers quiet environments.",             s:1 },
    { name:"Cleo",    species:"Cat", breed:"Siamese",               age:3, gender:"Female", status:"Adopted",     img:cat[3],  notes:"Vocal and social. Demands constant attention.",              s:1 },
    { name:"Simba",   species:"Cat", breed:"Maine Coon",            age:5, gender:"Male",   status:"Available",   img:cat[4],  notes:"Large and fluffy. Surprisingly dog-like behaviour.",         s:2 },
    { name:"Felix",   species:"Cat", breed:"Bengal",                age:2, gender:"Male",   status:"Available",   img:cat[5],  notes:"Playful and energetic. Needs plenty of enrichment.",         s:2 },
    { name:"Oliver",  species:"Cat", breed:"Tabby",                 age:7, gender:"Male",   status:"Available",   img:cat[6],  notes:"Laid-back senior. Happy napping in sunny spots.",            s:2 },
    { name:"Misty",   species:"Cat", breed:"Russian Blue",          age:1, gender:"Female", status:"Available",   img:cat[7],  notes:"Shy at first but very loving once settled.",                 s:3 },
    { name:"Oscar",   species:"Cat", breed:"Persian",               age:4, gender:"Male",   status:"Medical Hold",img:cat[8],  notes:"Needs daily grooming. Mild infection treatment.",            s:3 },
    { name:"Lily",    species:"Cat", breed:"Domestic Longhair",     age:3, gender:"Female", status:"Available",   img:cat[9],  notes:"Calm and gentle. Great with other cats.",                    s:3 },
    { name:"Jasper",  species:"Cat", breed:"Scottish Fold",         age:2, gender:"Male",   status:"Available",   img:cat[10], notes:"Folded ears and round face. Extremely calm.",                s:0 },
    { name:"Poppy",   species:"Cat", breed:"Tortoiseshell",         age:5, gender:"Female", status:"Available",   img:cat[11], notes:"Sassy but loyal. Bonds deeply with one person.",             s:1 },
    { name:"Ginger",  species:"Cat", breed:"Ginger Tabby",          age:3, gender:"Male",   status:"Available",   img:cat[12], notes:"Curious ginger tom. Loves window-watching.",                 s:2 },
    { name:"Nala",    species:"Cat", breed:"Abyssinian",            age:2, gender:"Female", status:"Available",   img:cat[13], notes:"Slender and athletic. Loves to explore.",                    s:3 },
    { name:"Leo",     species:"Cat", breed:"Norwegian Forest Cat",  age:4, gender:"Male",   status:"Available",   img:cat[14], notes:"Thick coat and adventurous spirit. Good outdoor cat.",       s:0 },
  ];

  const stmt = db.prepare(`
    INSERT INTO animals (name,species,breed,age,gender,status,image,notes,shelter_id)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  animals.forEach(a => {
    stmt.run(a.name, a.species, a.breed, a.age, a.gender,
             a.status, a.img, a.notes, ids[a.s]);
  });
  stmt.finalize(() => console.log(`🐾 Seeded 35 animals across 4 shelters`));
}

module.exports = db;
