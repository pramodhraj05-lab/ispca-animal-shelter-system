const API = "http://localhost:3000/animals";

const TOKEN = localStorage.getItem("token");
const USER = JSON.parse(localStorage.getItem("user") || "null");

// Redirect if not logged in
if (!TOKEN || !USER) {
  console.log("No credentials found, redirecting to login...");
  window.location.href = "/";
}

// Load animals on page load
window.onload = fetchAnimals;

// ─────────────────────────────────────────────
// FETCH ANIMALS
// ─────────────────────────────────────────────
function fetchAnimals() {
  fetch(API, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {
      // ⚠️ FIXED: correct container id
      const container = document.getElementById("cards-grid");
      container.innerHTML = "";

      data.forEach(animal => {
        const div = document.createElement("div");

        div.style.border = "1px solid black";
        div.style.margin = "10px";
        div.style.padding = "10px";

        div.innerHTML = `
          <h3>${animal.name}</h3>
          <p>Species: ${animal.species}</p>
          <p>Age: ${animal.age || "N/A"}</p>
          <img src="${animal.image || ""}" width="150"/><br><br>
          ${USER.role === "admin" ? `<button onclick="deleteAnimal(${animal.id})">Delete</button>` : ""}
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      alert("Error loading animals. Login again.");
      localStorage.clear();
      window.location.href = "/";
    });
}

// ─────────────────────────────────────────────
// ADD ANIMAL
// ─────────────────────────────────────────────
function addAnimal() {
  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("species", document.getElementById("species").value);
  formData.append("age", document.getElementById("age").value);

  fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`
    },
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to add animal");
      return res.json();
    })
    .then(() => {
      fetchAnimals();

      // clear inputs
      document.getElementById("name").value = "";
      document.getElementById("species").value = "";
      document.getElementById("age").value = "";
    })
    .catch(err => {
      console.error(err);
      alert("Error adding animal");
    });
}

// ─────────────────────────────────────────────
// DELETE ANIMAL
// ─────────────────────────────────────────────
function deleteAnimal(id) {
  if (!confirm("Are you sure you want to delete this animal?")) return;

  fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Delete failed");
      fetchAnimals();
    })
    .catch(err => {
      console.error(err);
      alert("Error deleting animal");
    });
}