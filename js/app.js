// JavaScript de PokéAprende
// Aquí van las validaciones con DOM de cada sección.

// ===== SECCIÓN JUGAR AHORA =====

// Seleccionar los elementos por su id
const inputPoke = document.getElementById("poke");
const botonBuscar = document.getElementById("boton1");
const resultado = document.getElementById("resultado");

// Al hacer click en "Buscar"
botonBuscar.addEventListener("click", async () => {
  // Obtener el valor del input (trim quita los espacios, toLowerCase pasa a minúscula)
  const valor = inputPoke.value.trim().toLowerCase();

  // 1.- Validar que tenga datos
  if (valor === "") {
    alert("Debes ingresar un tipo antes de buscar");
    inputPoke.focus();
    return;
  }

  // 2.- Mostrar el valor en consola
  console.log("Valor ingresado:", valor);

  // Mensaje mientras responde la API
  resultado.innerHTML = "<p>Cargando...</p>";

  try {
    // 3.- Consumir la API
    const respuesta = await fetch(`https://pokeapi.co/api/v2/type/${valor}`);
    if (!respuesta.ok) throw new Error("Tipo no encontrado");
    const datos = await respuesta.json();

    // 4.- Mostrar en pantalla los primeros 12 pokémon
    resultado.innerHTML = "";
    datos.pokemon.slice(0, 20).forEach((item) => {
      const nombre = item.pokemon.name;
      const id = item.pokemon.url.split("/").at(-2); // el id viene al final de la url
      const imagen = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

      const col = document.createElement("div");
      col.className = "col-6 col-md-3";
      col.innerHTML = `
        <div class="card text-center shadow-sm">
          <img src="${imagen}" class="card-img-top" alt="${nombre}">
          <div class="card-body"><h5 class="card-title text-capitalize">${nombre}</h5></div>
        </div>`;
      resultado.appendChild(col);
    });
  } catch (error) {
    resultado.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
});
