const API = "http://localhost:3000/animals";

const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");

if (!TOKEN || !USER) {
  console.log("No credentials found, redirecting to login...");
  window.location.href = "/"; 
}

window.onload = fetchAnimals;

function fetchAnimals() {
  fetch(API, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {
      const container = document.getElementById("animalList");
      container.innerHTML = "";

      data.forEach(animal => {
        const div = document.createElement("div");
        div.style.border = "1px solid black";
        div.style.margin = "10px";
        div.style.padding = "10px";

        div.innerHTML = `
          <h3>${animal.name}</h3>
          <p>Species: ${animal.species}</p>
          <p>Age: ${animal.age}</p>
          <img src="${animal.image || ''}" width="150"/><br><br>
          <button onclick="deleteAnimal(${animal.id})">Delete</button>
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      alert("Error loading animals. Login again.");
    });
}

function addAnimal() {
  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("species", document.getElementById("species").value);
  formData.append("age", document.getElementById("age").value);

  fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
    .then(res => res.json())
    .then(() => {
      fetchAnimals();
    });
}

function deleteAnimal(id) {
  fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(() => {
      fetchAnimals();
    });
}