// ── AUTH ─────────────────────────
const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");

if (!TOKEN || !USER) window.location.href = "/";

const IS_ADMIN = USER?.role === "admin";

// ── GLOBAL STATE ─────────────────
let currentSection = "animals";
let allData = [];

// ── API ──────────────────────────
async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.href = "/";
    return null;
  }

  return res;
}

// ── INIT ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupUserUI();
  setupNavigation();
  loadSection("animals");
});

// ── USER UI ──────────────────────
function setupUserUI() {
  document.getElementById("user-name").textContent = USER.name;
  document.getElementById("user-role").textContent = USER.role;

  if (IS_ADMIN) {
    document.querySelectorAll(".admin-only")
      .forEach(el => el.classList.remove("hidden"));
  }
}

// ── NAVIGATION ───────────────────
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();

      document.querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

      item.classList.add("active");

      const section = item.dataset.section;
      loadSection(section);
    });
  });
}

// ── SECTION META ─────────────────
const SECTION_META = {
  animals:   { endpoint: "/animals" },
  shelters:  { endpoint: "/shelters" },
  adoptions: { endpoint: "/adoptions" }
};

// ── LOAD SECTION ─────────────────
async function loadSection(section) {
  currentSection = section;

  if (!SECTION_META[section]) return;

  try {
    const res = await api(SECTION_META[section].endpoint);

    if (!res || !res.ok) throw new Error("API failed");

    const data = await res.json();
    allData = data;

    if (section === "animals") renderAnimals(data);
    if (section === "shelters") renderShelters(data);
    if (section === "adoptions") renderAdoptions(data);

  } catch (err) {
    document.getElementById("cards-grid").innerHTML =
      `<p style="color:red">Failed to load ${section}</p>`;
  }
}

// ── UTILS ────────────────────────
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

function statusClass(s) {
  s = (s || "").toLowerCase();
  if (s.includes("available")) return "status-available";
  if (s.includes("adopted")) return "status-adopted";
  if (s.includes("pending")) return "status-pending";
  return "status-default";
}

function speciesEmoji(sp) {
  if (!sp) return "🐾";
  sp = sp.toLowerCase();
  if (sp.includes("dog")) return "🐶";
  if (sp.includes("cat")) return "🐱";
  return "🐾";
}

// ── ANIMALS ──────────────────────
function renderAnimals(data) {

  // ✅ STATS FIXED
  document.getElementById("stat-total").textContent = data.length;

  document.getElementById("stat-available").textContent =
    data.filter(a => (a.status || "Available") === "Available").length;

  document.getElementById("stat-adopted").textContent =
    data.filter(a => a.status === "Adopted").length;

  document.getElementById("stat-species").textContent =
    new Set(data.map(a => (a.species || "").toLowerCase()).filter(Boolean)).size;

  const grid = document.getElementById("cards-grid");

  if (!data.length) {
    grid.innerHTML = `<p>No animals found</p>`;
    return;
  }

  grid.innerHTML = "";

  data.forEach((a, i) => {
    const card = document.createElement("div");
    card.className = "animal-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const imgHTML = a.image
      ? `<img class="card-image" src="${esc(a.image)}">`
      : `<div class="card-image-placeholder">${speciesEmoji(a.species)}</div>`;

    const adminBtns = IS_ADMIN ? `
      <button class="card-btn" onclick="deleteAnimal(${a.id})">Delete</button>
    ` : "";

    card.innerHTML = `
      <div class="card-image-wrap">
        ${imgHTML}
        <span class="card-status ${statusClass(a.status)}">
          ${esc(a.status || "Available")}
        </span>
      </div>
      <div class="card-body">
        <div class="card-name">${esc(a.name)}</div>
        <div class="card-meta">${esc(a.species)}</div>
        <div class="card-actions">${adminBtns}</div>
      </div>
    `;

    grid.appendChild(card);

    // SAFE IMAGE FALLBACK
    const img = card.querySelector("img");
    if (img) {
      img.onerror = function () {
        this.outerHTML = `<div class="card-image-placeholder">🐾</div>`;
      };
    }
  });
}

// ── SHELTERS ─────────────────────
function renderShelters(data) {
  const grid = document.getElementById("cards-grid");

  if (!data.length) {
    grid.innerHTML = `<p>No shelters found</p>`;
    return;
  }

  grid.innerHTML = data.map(s => `
    <div class="animal-card">
      <div class="card-body">
        <div class="card-name">${esc(s.name)}</div>
        <div>${esc(s.location)}</div>
      </div>
    </div>
  `).join("");
}

// ── ADOPTIONS ────────────────────
function renderAdoptions(data) {
  const grid = document.getElementById("cards-grid");

  if (!data.length) {
    grid.innerHTML = `<p>No adoptions found</p>`;
    return;
  }

  grid.innerHTML = data.map(a => `
    <div class="animal-card">
      <div class="card-body">
        <div class="card-name">${esc(a.animal_name || "Animal")}</div>
        <div>${esc(a.adopter_name)}</div>
        <div>${esc(a.status)}</div>
      </div>
    </div>
  `).join("");
}

// ── DELETE ───────────────────────
async function deleteAnimal(id) {
  const res = await api(`/animals/${id}`, { method: "DELETE" });

  if (res?.ok) {
    loadSection("animals");
  } else {
    alert("Delete failed");
  }
}