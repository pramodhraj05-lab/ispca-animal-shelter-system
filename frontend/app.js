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

// ── INIT ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupUser();
  setupNav();
  loadAnimals();
});

// ── USER UI ──────────────────────
function setupUser() {
  document.getElementById("user-name").textContent = USER.name;
  document.getElementById("user-role").textContent = USER.role;

  if (IS_ADMIN) {
    document.querySelectorAll(".admin-only")
      .forEach(el => el.classList.remove("hidden"));
  }
}

// ── NAVIGATION ───────────────────
function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();

      document.querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

      item.classList.add("active");

      const section = item.dataset.section;

      if (section === "animals") loadAnimals();
    });
  });
}

// ── LOAD ANIMALS ─────────────────
async function loadAnimals() {
  try {
    const res = await api("/animals");

    if (!res || !res.ok) throw new Error("API failed");

    const data = await res.json();

    allData = data;
    renderAnimals(data);

  } catch (err) {
    document.getElementById("cards-grid").innerHTML =
      `<p style="color:red">Failed to load animals</p>`;
  }
}

// ── RENDER ANIMALS (FIXED CORE) ──
function renderAnimals(data) {
  const grid = document.getElementById("cards-grid");

  if (!data.length) {
    grid.innerHTML = `<p>No animals found</p>`;
    return;
  }

  grid.innerHTML = "";

  data.forEach((a, i) => {
    const card = document.createElement("div");
    card.className = "animal-card";

    const imgHTML = a.image
      ? `<img class="card-image" src="${esc(a.image)}">`
      : `<div class="card-image-placeholder">${speciesEmoji(a.species)}</div>`;

    const adminBtns = IS_ADMIN ? `
      <button onclick="deleteAnimal(${a.id})">Delete</button>
    ` : "";

    card.innerHTML = `
      <div class="card-image-wrap">
        ${imgHTML}
        <span class="${statusClass(a.status)}">${esc(a.status)}</span>
      </div>
      <div>
        <h3>${esc(a.name)}</h3>
        <p>${esc(a.species)}</p>
        ${adminBtns}
      </div>
    `;

    grid.appendChild(card);

    // FIX: safe image fallback
    const img = card.querySelector("img");
    if (img) {
      img.onerror = function () {
        this.outerHTML = `<div class="card-image-placeholder">🐾</div>`;
      };
    }
  });
}

// ── DELETE ───────────────────────
async function deleteAnimal(id) {
  const res = await api(`/animals/${id}`, { method: "DELETE" });

  if (res?.ok) {
    loadAnimals();
  } else {
    alert("Delete failed");
  }
}