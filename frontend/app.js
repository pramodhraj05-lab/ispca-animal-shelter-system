const API = "http://localhost:3000/animals";

window.onload = fetchAnimals;

function fetchAnimals() {
  fetch(API)
    .then(res => res.json())
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
          <img src="${animal.image}" width="150"/>
        `;

        container.appendChild(div);
      });
    });
}

function addAnimal() {
  const name = document.getElementById("name").value;
  const species = document.getElementById("species").value;
  const age = document.getElementById("age").value;

  fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      species,
      age,
      image: "images/dog.png"
    })
  })
    .then(() => {
      fetchAnimals();
    });
}

div.innerHTML = `
  <div class="card">
    <img src="${animal.image}" />
    <h3>${animal.name}</h3>
    <p><b>Species:</b> ${animal.species}</p>
    <p><b>Age:</b> ${animal.age}</p>

    <button onclick="deleteAnimal(${animal.id})" style="background:red;margin-top:10px;">
      Delete
    </button>
  </div>
`;

function deleteAnimal(id) {
  fetch(`http://localhost:3000/animals/${id}`, {
    method: "DELETE"
  })
  .then(() => {
    fetchAnimals(); // refresh UI
  });
}