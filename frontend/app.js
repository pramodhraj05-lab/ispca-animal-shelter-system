// ── AUTH GUARD ─────────────────────────────────────
const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");
if (!TOKEN || !USER) { window.location.href = "/"; }

const IS_ADMIN = USER?.role === "admin";

// ── GLOBAL STATE ──────────────────────────────────
let currentSection = "animals";
let allData        = [];
let allShelters    = [];
let deleteCallback = null;

// ── API HELPER ────────────────────────────────────
async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401 || res.status === 403) { logout(); return null; }
  return res;
}

function logout() {
  localStorage.clear();
  window.location.href = "/";
}

// ── UTILS ──────────────────────────────────────────
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

function statusClass(s) {
  s = (s || "").toLowerCase();
  if (s.includes("available")) return "status-available";
  if (s.includes("adopted")) return "status-adopted";
  return "status-default";
}

function speciesEmoji(sp) {
  const s = (sp || "").toLowerCase();
  if (s.includes("dog")) return "🐶";
  if (s.includes("cat")) return "🐱";
  return "🐾";
}

// ── INIT ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  loadSection("animals");
});

// ── NAVIGATION ─────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const section = item.dataset.section;

      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      loadSection(section);
    });
  });
}

// ── LOAD SECTION ───────────────────────────────────
async function loadSection(section) {
  currentSection = section;

  if (section === "animals") {
    try {
      const res = await api("/animals");
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      allData = data;
      renderAnimals(data);
    } catch (err) {
      document.getElementById("cards-grid").innerHTML = "Error loading animals";
    }
  }
}

// ── RENDER ANIMALS (FIXED) ─────────────────────────
function renderAnimals(data) {
  const grid = document.getElementById("cards-grid");

  if (!data.length) {
    grid.innerHTML = "<p>No animals found</p>";
    return;
  }

  grid.innerHTML = "";

  data.forEach(a => {
    const card = document.createElement("div");
    card.className = "animal-card";

    const imgSrc = a.image || "";

    const imgHTML = imgSrc
      ? `<img class="card-image" src="${esc(imgSrc)}" alt="${esc(a.name)}">`
      : `<div class="card-image-placeholder">${speciesEmoji(a.species)}</div>`;

    card.innerHTML = `
      ${imgHTML}
      <h3>${esc(a.name)}</h3>
      <p>${esc(a.species)}</p>
    `;

    grid.appendChild(card);

    // ✅ SAFE IMAGE ERROR HANDLING (FIX)
    const img = card.querySelector(".card-image");
    if (img) {
      img.onerror = function () {
        this.outerHTML = `<div class="card-image-placeholder">${speciesEmoji(a.species)}</div>`;
      };
    }
  });
}