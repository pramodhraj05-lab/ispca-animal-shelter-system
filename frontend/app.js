const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");
if (!TOKEN || !USER) { window.location.href = "/"; }

const IS_ADMIN = false;


let currentSection = "animals";
let allData        = [];
let allShelters    = [];
let deleteCallback = null;


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

function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

function statusClass(s) {
  s = (s || "").toLowerCase();
  if (s.includes("available"))  return "status-available";
  if (s.includes("adopted"))    return "status-adopted";
  if (s.includes("medical"))    return "status-medical";
  if (s.includes("pending"))    return "status-pending";
  if (s.includes("approved"))   return "status-approved";
  if (s.includes("rejected"))   return "status-rejected";
  return "status-default";
}

function speciesEmoji(sp) {
  const s = (sp || "").toLowerCase();
  if (s.includes("dog"))               return "🐶";
  if (s.includes("cat"))               return "🐱";
  if (s.includes("bird")||s.includes("parrot")) return "🦜";
  if (s.includes("rabbit"))            return "🐰";
  if (s.includes("hamster"))           return "🐹";
  if (s.includes("turtle"))            return "🐢";
  if (s.includes("fish"))              return "🐟";
  if (s.includes("snake"))             return "🐍";
  return "🐾";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IE", { year:"numeric", month:"short", day:"numeric" });
}

let _toastT;
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(_toastT);
  _toastT = setTimeout(() => t.classList.remove("show"), 3500);
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach(o => {
  o.addEventListener("click", e => { if (e.target === o) o.classList.remove("open"); });
});

function showLoading() {
  document.getElementById("cards-grid").innerHTML =
    `<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>`;
}
function showGridError(msg) {
  document.getElementById("cards-grid").innerHTML =
    `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>${esc(msg)}</p>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  setupUserUI();
  setupNavigation();
  setupSearch();
  setupAddBtn();
  setupAnimalForm();
  setupShelterForm();
  setupAdoptionForm();
  setupDeleteModal();
  loadSection("animals");
  loadSheltersCache();
});

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const section = item.dataset.section;
      // Update active state
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      loadSection(section);
    });
  });
}

const SECTION_META = {
  animals:   { title:"Animals",   subtitle:"All animals in the shelter system", endpoint:"/animals" },
  shelters:  { title:"Shelters",  subtitle:"All registered ISPCA shelters",     endpoint:"/shelters" },
  adoptions: { title:"Adoptions", subtitle:"Adoption requests & status",        endpoint:"/adoptions" },
  track:     { title:"Track",     subtitle:"Track an adoption request",         endpoint:null },
};

async function loadSection(section) {
  currentSection = section;
  const meta = SECTION_META[section] || {};

  document.getElementById("page-title").textContent    = meta.title    || section;
  document.getElementById("page-subtitle").textContent = meta.subtitle || "";
  document.getElementById("stats-bar").style.display   = section === "animals" ? "flex" : "none";
  document.getElementById("search-input").value        = "";

  if (section === "track") { renderTrack(); return; }

  showLoading();

  try {
    const res = await api(meta.endpoint);
    if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
    allData = await res.json();
    renderSection(section, allData);
  } catch (err) {
    showGridError(`Failed to load ${section}: ${err.message}`);
  }
}

function renderSection(section, data) {
  if      (section === "animals")   renderAnimals(data);
  else if (section === "shelters")  renderShelters(data);
  else if (section === "adoptions") renderAdoptions(data);
}

function renderAnimals(data) {
  // Update stats
  document.getElementById("stat-total").textContent     = data.length;
  document.getElementById("stat-available").textContent = data.filter(a => (a.status||"Available") === "Available").length;
  document.getElementById("stat-adopted").textContent   = data.filter(a => a.status === "Adopted").length;
  document.getElementById("stat-species").textContent   = new Set(data.map(a => (a.species||"").toLowerCase()).filter(Boolean)).size;

  const grid = document.getElementById("cards-grid");
  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🐾</div>
        <h3>No animals found</h3>
        <p>${IS_ADMIN ? 'Click "+ Add New" to add an animal.' : "No animals currently in the system."}</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";
  data.forEach((a, i) => {
    const card = document.createElement("div");
    card.className = "animal-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const imgSrc = a.image || "";
    const imgHTML = imgSrc
      ? `<img class="card-image" src="${esc(imgSrc)}" alt="${esc(a.name)}"
             onerror="this.parentElement.innerHTML='<div class=\'card-image-placeholder\'>${speciesEmoji(a.species)}</div>'">`
      : `<div class="card-image-placeholder">${speciesEmoji(a.species)}</div>`;

   
    const adminBtns = IS_ADMIN ? `
      <button class="card-btn card-btn-edit"   onclick="openEditAnimal(${a.id})">✏️ Edit</button>
      <button class="card-btn card-btn-delete" onclick="confirmDelete(() => deleteAnimal(${a.id}))">🗑️</button>
    ` : "";

    
    const adoptBtn = a.status !== "Adopted"
      ? `<button class="card-btn card-btn-adopt" onclick="openAdoptionRequest(${a.id},'${esc(a.name)}','${esc(a.species)}')">❤️ Adopt</button>`
      : `<span class="card-btn" style="opacity:.45;cursor:default;background:var(--border)">Adopted</span>`;

    card.innerHTML = `
      <div class="card-image-wrap">
        ${imgHTML}
        <span class="card-status ${statusClass(a.status)}">${esc(a.status||"Available")}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${esc(a.name)}</div>
        <div class="card-meta">
          <span class="card-tag">${esc(a.species)}</span>
          ${a.breed  ? `<div class="card-dot"></div><span class="card-tag">${esc(a.breed)}</span>` : ""}
          ${a.age!=null ? `<div class="card-dot"></div><span class="card-tag">${a.age} yr${a.age!==1?"s":""}</span>` : ""}
          ${a.gender ? `<div class="card-dot"></div><span class="card-tag">${esc(a.gender)}</span>` : ""}
        </div>
        ${a.shelter_name ? `<div class="card-shelter">🏠 ${esc(a.shelter_name)}</div>` : ""}
        ${a.notes ? `<p class="card-notes">${esc(a.notes)}</p>` : ""}
        <div class="card-actions">${adoptBtn}${adminBtns}</div>
      </div>`;
    grid.appendChild(card);
  });
}


async function loadSheltersCache() {
  try {
    const res = await api("/shelters");
    if (res && res.ok) { allShelters = await res.json(); populateShelterDropdown(); }
  } catch (_) {}
}

function populateShelterDropdown() {
  const sel = document.getElementById("form-shelter");
  sel.innerHTML = `<option value="">None</option>`;
  allShelters.forEach(s => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.name} — ${s.location}`;
    sel.appendChild(o);
  });
}

function setupAddBtn() {
  document.getElementById("add-btn").addEventListener("click", () => {
    if (currentSection === "animals")  openAddAnimal();
    if (currentSection === "shelters") openAddShelter();
  });
}

function openAddAnimal() {
  document.getElementById("animal-modal-title").textContent = "Add New Animal";
  document.getElementById("animal-submit-btn").textContent  = "Save Animal";
  document.getElementById("form-id").value = "";
  document.getElementById("animal-form").reset();
  clearImage();
  populateShelterDropdown();
  openModal("animal-modal-overlay");
}

function openEditAnimal(id) {
  const a = allData.find(x => x.id === id);
  if (!a) return;
  document.getElementById("animal-modal-title").textContent = "Edit Animal";
  document.getElementById("animal-submit-btn").textContent  = "Update Animal";
  document.getElementById("form-id").value       = a.id;
  document.getElementById("form-name").value     = a.name    || "";
  document.getElementById("form-species").value  = a.species || "";
  document.getElementById("form-breed").value    = a.breed   || "";
  document.getElementById("form-age").value      = a.age     ?? "";
  document.getElementById("form-gender").value   = a.gender  || "";
  document.getElementById("form-status").value   = a.status  || "Available";
  document.getElementById("form-notes").value    = a.notes   || "";
  document.getElementById("form-image-url").value = (a.image && a.image.startsWith("http")) ? a.image : "";
  clearImage();
  if (a.image) {
    document.getElementById("image-preview").src = a.image;
    document.getElementById("image-preview-wrap").style.display = "block";
    document.getElementById("image-upload-prompt").style.display = "none";
  }
  populateShelterDropdown();
  document.getElementById("form-shelter").value = a.shelter_id || "";
  openModal("animal-modal-overlay");
}


function previewImage(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("image-preview").src = e.target.result;
    document.getElementById("image-preview-wrap").style.display = "block";
    document.getElementById("image-upload-prompt").style.display = "none";
    document.getElementById("form-image-url").value = "";
  };
  reader.readAsDataURL(input.files[0]);
}

function clearImage() {
  document.getElementById("form-image-file").value = "";
  document.getElementById("image-preview").src = "";
  document.getElementById("image-preview-wrap").style.display = "none";
  document.getElementById("image-upload-prompt").style.display = "flex";
}

function setupAnimalForm() {
  document.getElementById("animal-form").addEventListener("submit", handleAnimalSubmit);
}

async function handleAnimalSubmit() {
  const id      = document.getElementById("form-id").value;
  const name    = document.getElementById("form-name").value.trim();
  const species = document.getElementById("form-species").value.trim();
  if (!name || !species) { showToast("Name and Species are required.", "error"); return; }

  const btn = document.getElementById("animal-submit-btn");
  btn.textContent = "Saving…"; btn.disabled = true;

  try {
    const fd = new FormData();
    fd.append("name",       name);
    fd.append("species",    species);
    fd.append("breed",      document.getElementById("form-breed").value.trim());
    fd.append("age",        document.getElementById("form-age").value);
    fd.append("gender",     document.getElementById("form-gender").value);
    fd.append("status",     document.getElementById("form-status").value);
    fd.append("notes",      document.getElementById("form-notes").value.trim());
    fd.append("shelter_id", document.getElementById("form-shelter").value);
    fd.append("image_url",  document.getElementById("form-image-url").value.trim());
    const fileEl = document.getElementById("form-image-file");
    if (fileEl.files[0]) fd.append("image", fileEl.files[0]);

    const res = await fetch(id ? `/animals/${id}` : "/animals", {
      method: id ? "PUT" : "POST",
      headers: { "Authorization": `Bearer ${TOKEN}` },  // NO Content-Type with FormData
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");

    closeModal("animal-modal-overlay");
    showToast(id ? "Animal updated!" : "Animal added!", "success");
    await loadSection("animals");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    btn.textContent = id ? "Update Animal" : "Save Animal";
    btn.disabled = false;
  }
}

async function deleteAnimal(id) {
  const res = await api(`/animals/${id}`, { method: "DELETE" });
  if (res?.ok) { showToast("Animal deleted.", "success"); await loadSection("animals"); }
  else { const d = await res?.json(); showToast(d?.error || "Failed to delete.", "error"); }
}

function renderShelters(data) {
  const grid = document.getElementById("cards-grid");
  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏠</div>
        <h3>No shelters found</h3>
        <p>${IS_ADMIN ? 'Click "+ Add New" to add a shelter.' : "No shelters registered yet."}</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";
  data.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "shelter-card";
    card.style.animationDelay = `${i * 0.05}s`;

    const count    = s.animal_count || 0;
    const capacity = s.capacity     || 0;
    const pct      = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
    const barColor = pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--accent)";

    const adminBtns = IS_ADMIN ? `
      <div class="card-actions" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-card)">
        <button class="card-btn card-btn-edit"   onclick="openEditShelter(${s.id})">✏️ Edit</button>
        <button class="card-btn card-btn-delete" onclick="confirmDelete(() => deleteShelter(${s.id}))">🗑️ Delete</button>
      </div>` : "";

    card.innerHTML = `
      <div class="shelter-header">
        <div class="shelter-emoji">🏠</div>
        <div class="shelter-header-info">
          <div class="shelter-card-name">${esc(s.name)}</div>
          <div class="shelter-location">📍 ${esc(s.location)}</div>
        </div>
        <span class="animal-count-badge">${count} animals</span>
      </div>
      <div class="shelter-body">
        ${s.phone ? `<div class="shelter-detail"><span>📞</span> ${esc(s.phone)}</div>` : ""}
        ${s.email ? `<div class="shelter-detail"><span>📧</span> ${esc(s.email)}</div>` : ""}
        ${capacity ? `
          <div class="shelter-detail"><span>🏷️</span> Capacity: ${count} / ${capacity}</div>
          <div class="capacity-bar-wrap">
            <div class="capacity-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
          <div style="font-size:.72rem;color:var(--text-light);margin-top:4px">${pct}% occupied</div>
        ` : ""}
        ${adminBtns}
      </div>`;
    grid.appendChild(card);
  });
}

function openAddShelter() {
  document.getElementById("shelter-modal-title").textContent = "Add Shelter";
  document.getElementById("shelter-submit-btn").textContent  = "Save Shelter";
  document.getElementById("shelter-form-id").value = "";
  document.getElementById("shelter-form").reset();
  openModal("shelter-modal-overlay");
}

function openEditShelter(id) {
  const s = allData.find(x => x.id === id);
  if (!s) return;
  document.getElementById("shelter-modal-title").textContent = "Edit Shelter";
  document.getElementById("shelter-submit-btn").textContent  = "Update Shelter";
  document.getElementById("shelter-form-id").value    = s.id;
  document.getElementById("shelter-name").value       = s.name     || "";
  document.getElementById("shelter-location").value   = s.location || "";
  document.getElementById("shelter-phone").value      = s.phone    || "";
  document.getElementById("shelter-email").value      = s.email    || "";
  document.getElementById("shelter-capacity").value   = s.capacity || "";
  openModal("shelter-modal-overlay");
}

function setupShelterForm() {
  document.getElementById("shelter-form").addEventListener("submit", handleShelterSubmit);
}

async function handleShelterSubmit() {
  const id       = document.getElementById("shelter-form-id").value;
  const name     = document.getElementById("shelter-name").value.trim();
  const location = document.getElementById("shelter-location").value.trim();
  if (!name || !location) { showToast("Name and Location required.", "error"); return; }

  const btn = document.getElementById("shelter-submit-btn");
  btn.textContent = "Saving…"; btn.disabled = true;

  try {
    const body = {
      name, location,
      phone:    document.getElementById("shelter-phone").value.trim(),
      email:    document.getElementById("shelter-email").value.trim(),
      capacity: document.getElementById("shelter-capacity").value || null,
    };
    const res = await api(id ? `/shelters/${id}` : "/shelters", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    closeModal("shelter-modal-overlay");
    showToast(id ? "Shelter updated!" : "Shelter added!", "success");
    await loadSection("shelters");
    await loadSheltersCache();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    btn.textContent = "Save Shelter"; btn.disabled = false;
  }
}

async function deleteShelter(id) {
  const res = await api(`/shelters/${id}`, { method: "DELETE" });
  if (res?.ok) { showToast("Shelter deleted.", "success"); await loadSection("shelters"); await loadSheltersCache(); }
  else { showToast("Failed to delete shelter.", "error"); }
}


function renderAdoptions(data) {
  const grid = document.getElementById("cards-grid");
  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❤️</div>
        <h3>No adoption requests yet</h3>
        <p>Browse animals and click "❤️ Adopt" to submit a request.</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";
  data.forEach((ad, i) => {
    const card = document.createElement("div");
    card.className = "adoption-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const imgSrc  = ad.animal_image || "";
    const thumbHTML = imgSrc
      ? `<div class="adoption-animal-img"><img src="${esc(imgSrc)}" alt="animal"></div>`
      : `<div class="adoption-animal-img">${speciesEmoji(ad.animal_species)}</div>`;

    const adminBtns = IS_ADMIN ? `
      <div class="card-actions" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-card)">
        <button class="card-btn card-btn-approve" onclick="openAdoptionEdit(${ad.id},'${esc(ad.status)}')">⚙️ Update Status</button>
        <button class="card-btn card-btn-delete"  onclick="confirmDelete(() => deleteAdoption(${ad.id}))">🗑️</button>
      </div>` : "";

    card.innerHTML = `
      <div class="adoption-card-header">
        <span class="adoption-id">Request #${ad.id}</span>
        <span class="card-status ${statusClass(ad.status)}">${esc(ad.status || "Pending")}</span>
      </div>
      <div class="adoption-card-body">
        <div class="adoption-animal">
          ${thumbHTML}
          <div>
            <div class="adoption-animal-name">${esc(ad.animal_name || `Animal #${ad.animal_id}`)}</div>
            <div class="adoption-animal-species">${esc(ad.animal_species || "—")}</div>
          </div>
        </div>
        <div class="adoption-info">
          <div><strong>Adopter:</strong> ${esc(ad.adopter_name)}</div>
          ${ad.adopter_email ? `<div><strong>Email:</strong> ${esc(ad.adopter_email)}</div>` : ""}
          ${ad.adopter_phone ? `<div><strong>Phone:</strong> ${esc(ad.adopter_phone)}</div>` : ""}
          <div><strong>Date:</strong> ${fmtDate(ad.adoption_date)}</div>
          <div><strong>Submitted:</strong> ${fmtDate(ad.created_at)}</div>
          ${ad.notes ? `<div><strong>Message:</strong> ${esc(ad.notes)}</div>` : ""}
        </div>
        ${adminBtns}
      </div>`;
    grid.appendChild(card);
  });
}


function openAdoptionRequest(animalId, animalName, animalSpecies) {
  document.getElementById("adoption-animal-id").value          = animalId;
  document.getElementById("adoption-modal-title").textContent  = `Adopt ${animalName}`;
  document.getElementById("adoption-animal-info").textContent  = `${animalName} · ${animalSpecies}`;
  document.getElementById("adoption-name").value  = USER.name  || "";
  document.getElementById("adoption-email").value = USER.email || "";
  document.getElementById("adoption-phone").value = "";
  document.getElementById("adoption-notes").value = "";
  openModal("adoption-modal-overlay");
}

function setupAdoptionForm() {
  document.getElementById("adoption-form").addEventListener("submit", handleAdoptionSubmit);
}

async function handleAdoptionSubmit() {
  const animal_id    = document.getElementById("adoption-animal-id").value;
  const adopter_name = document.getElementById("adoption-name").value.trim();
  if (!adopter_name) { showToast("Your name is required.", "error"); return; }

  const btn = document.getElementById("adoption-submit-btn");
  btn.textContent = "Submitting…"; btn.disabled = true;

  try {
    const body = {
      animal_id:     parseInt(animal_id),
      adopter_name,
      adopter_email: document.getElementById("adoption-email").value.trim(),
      adopter_phone: document.getElementById("adoption-phone").value.trim(),
      adoption_date: document.getElementById("adoption-date").value || null,
      notes:         document.getElementById("adoption-notes").value.trim(),
    };
    const res  = await api("/adoptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");

    closeModal("adoption-modal-overlay");
    showToast(`Request submitted! Your ID: #${data.id} — track it with your email.`, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    btn.textContent = "Submit Request"; btn.disabled = false;
  }
}


function openAdoptionEdit(id, currentStatus) {
  document.getElementById("adoption-edit-id").value     = id;
  document.getElementById("adoption-edit-status").value = currentStatus || "Pending";
  openModal("adoption-edit-overlay");
}

async function updateAdoptionStatus() {
  const id     = document.getElementById("adoption-edit-id").value;
  const status = document.getElementById("adoption-edit-status").value;
  const res    = await api(`/adoptions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (res?.ok) {
    closeModal("adoption-edit-overlay");
    showToast(`Status updated → ${status}`, "success");
    await loadSection("adoptions");
  } else {
    showToast("Failed to update status.", "error");
  }
}

async function deleteAdoption(id) {
  const res = await api(`/adoptions/${id}`, { method: "DELETE" });
  if (res?.ok) { showToast("Adoption deleted.", "success"); await loadSection("adoptions"); }
  else { showToast("Failed to delete.", "error"); }
}


function renderTrack() {
  document.getElementById("cards-grid").innerHTML = `
    <div class="track-section">
      <div class="track-card">
        <div class="track-icon">🔎</div>
        <h3 class="track-title">Track Your Adoption Request</h3>
        <p class="track-sub">Enter the email you used when applying, or your request ID</p>

        <div class="form" style="max-width:420px;margin:0 auto">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" id="track-email-dash" class="form-input" placeholder="Email used when applying"/>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:.72rem">— or — Request ID</label>
            <input type="number" id="track-id-dash" class="form-input" placeholder="e.g. 4"/>
          </div>
          <div id="track-error-dash" class="auth-error"></div>
          <button class="btn btn-primary" style="width:100%;margin-top:4px" onclick="handleTrackDash()" id="track-btn-dash">
            Check Status
          </button>
        </div>

        <div id="track-result-dash" style="margin-top:24px;max-width:500px;margin-left:auto;margin-right:auto"></div>
      </div>
    </div>`;
}

async function handleTrackDash() {
  const email  = document.getElementById("track-email-dash").value.trim();
  const id     = document.getElementById("track-id-dash").value.trim();
  const errEl  = document.getElementById("track-error-dash");
  const result = document.getElementById("track-result-dash");
  const btn    = document.getElementById("track-btn-dash");
  errEl.style.display = "none"; result.innerHTML = "";
  if (!email && !id) { showErr(errEl,"Enter your email or request ID."); return; }
  btn.textContent = "Checking…"; btn.disabled = true;

  try {
    const query = id ? `id=${id}` : `email=${encodeURIComponent(email)}`;
    const res   = await fetch(`/adoptions/track?${query}`);
    const data  = await res.json();
    if (!res.ok) { showErr(errEl, data.error); return; }
    const rows  = Array.isArray(data) ? data : [data];
    result.innerHTML = rows.map(r => {
      const sc = statusClass(r.status);
      return `
        <div class="adoption-card" style="margin-bottom:14px;animation:none">
          <div class="adoption-card-header">
            <span class="adoption-id">Request #${r.id}</span>
            <span class="card-status ${sc}">${esc(r.status)}</span>
          </div>
          <div class="adoption-card-body">
            <div class="adoption-info">
              <div><strong>Animal:</strong> ${esc(r.animal_name||"Animal #"+r.animal_id)} · ${esc(r.animal_species||"")}</div>
              <div><strong>Adopter:</strong> ${esc(r.adopter_name)}</div>
              ${r.adopter_email ? `<div><strong>Email:</strong> ${esc(r.adopter_email)}</div>` : ""}
              <div><strong>Preferred date:</strong> ${fmtDate(r.adoption_date)}</div>
              <div><strong>Submitted:</strong> ${fmtDate(r.created_at)}</div>
              ${r.notes ? `<div><strong>Message:</strong> ${esc(r.notes)}</div>` : ""}
            </div>
          </div>
        </div>`;
    }).join("");
  } catch { showErr(errEl, "Could not reach server."); }
  finally { btn.textContent = "Check Status"; btn.disabled = false; }
}

function showErr(el, msg) { el.textContent = msg; el.style.display = "block"; }

function setupDeleteModal() {
  document.getElementById("delete-confirm-btn").addEventListener("click", async () => {
    if (!deleteCallback) return;
    const btn = document.getElementById("delete-confirm-btn");
    btn.textContent = "Deleting…"; btn.disabled = true;
    await deleteCallback();
    closeModal("delete-overlay");
    btn.textContent = "Yes, Delete"; btn.disabled = false;
    deleteCallback = null;
  });
}

function confirmDelete(cb) {
  deleteCallback = cb;
  openModal("delete-overlay");
}

function setupSearch() {
  document.getElementById("search-input").addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { renderSection(currentSection, allData); return; }
    const filtered = allData.filter(item =>
      [item.name, item.species, item.breed, item.location,
       item.adopter_name, item.animal_name, item.email]
        .map(f => (f||"").toLowerCase())
        .some(f => f.includes(q))
    );
    renderSection(currentSection, filtered);
  });
}