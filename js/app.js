// JavaScript de PokéAprende
// Aquí van las validaciones con DOM de cada sección.

// ===== SECCIÓN JUGAR AHORA =====

// Lista de tipos: nombre en inglés (como lo pide la API), nombre en español y color
const TIPOS = {
  normal:   { es: "Normal",    color: "#A8A77A" },
  fire:     { es: "Fuego",     color: "#EE8130" },
  water:    { es: "Agua",      color: "#6390F0" },
  grass:    { es: "Planta",    color: "#7AC74C" },
  electric: { es: "Eléctrico", color: "#F7D02C" },
  ice:      { es: "Hielo",     color: "#96D9D6" },
  fighting: { es: "Lucha",     color: "#C22E28" },
  poison:   { es: "Veneno",    color: "#A33EA1" },
  ground:   { es: "Tierra",    color: "#E2BF65" },
  flying:   { es: "Volador",   color: "#A98FF3" },
  psychic:  { es: "Psíquico",  color: "#F95587" },
  bug:      { es: "Bicho",     color: "#A6B91A" },
  rock:     { es: "Roca",      color: "#B6A136" },
  ghost:    { es: "Fantasma",  color: "#735797" },
  dragon:   { es: "Dragón",    color: "#6F35FC" },
  dark:     { es: "Siniestro", color: "#705746" },
  steel:    { es: "Acero",     color: "#B7B7CE" },
  fairy:    { es: "Hada",      color: "#D685AD" },
};

const POR_PAGINA = 20; // cuántos Pokémon se muestran cada vez

// Seleccionar los elementos por su id
const formJugar = document.getElementById("form-jugar");
const inputPoke = document.getElementById("poke");
const botonBuscar = document.getElementById("boton1");
const mensajeJugar = document.getElementById("mensaje-jugar");
const listaTipos = document.getElementById("lista-tipos");
const contenedorTipos = document.getElementById("tipos");
const infoResultado = document.getElementById("info-resultado");
const resultado = document.getElementById("resultado");
const botonVerMas = document.getElementById("ver-mas");

let listaPokemon = []; // pokémon del último tipo buscado
let mostrados = 0;     // cuántos ya están en pantalla
let tipoActual = "";   // clave en inglés del tipo buscado

// Quita tildes y pasa a minúscula: "Eléctrico" -> "electrico"
function normalizar(texto) {
  return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Recibe lo que escribió el usuario y devuelve la clave en inglés (o null si no existe)
function buscarClaveTipo(texto) {
  const valor = normalizar(texto);
  for (const clave in TIPOS) {
    if (clave === valor || normalizar(TIPOS[clave].es) === valor) {
      return clave;
    }
  }
  return null;
}

// Crear los botones de tipos y las sugerencias del input
for (const clave in TIPOS) {
  const tipo = TIPOS[clave];

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn btn-sm chip-tipo";
  boton.textContent = tipo.es;
  boton.dataset.tipo = clave;
  boton.style.backgroundColor = tipo.color;
  boton.addEventListener("click", () => {
    inputPoke.value = tipo.es;
    buscarTipo(clave);
  });
  contenedorTipos.appendChild(boton);

  const opcion = document.createElement("option");
  opcion.value = tipo.es;
  listaTipos.appendChild(opcion);
}

// Al enviar el formulario (click en "Buscar" o tecla Enter)
formJugar.addEventListener("submit", (evento) => {
  evento.preventDefault(); // evita que la página se recargue
  mensajeJugar.textContent = "";
  inputPoke.classList.remove("is-invalid");

  // 1.- Validar que tenga datos
  if (inputPoke.value.trim() === "") {
    mostrarError("Debes ingresar un tipo antes de buscar.");
    return;
  }

  // 2.- Validar que el tipo exista
  const clave = buscarClaveTipo(inputPoke.value);
  if (clave === null) {
    mostrarError(`"${inputPoke.value.trim()}" no es un tipo válido. Prueba con uno de los botones de abajo.`);
    return;
  }

  buscarTipo(clave);
});

function mostrarError(texto) {
  mensajeJugar.textContent = texto;
  inputPoke.classList.add("is-invalid");
  inputPoke.focus();
}

// 3.- Consumir la API y guardar la lista de pokémon del tipo
async function buscarTipo(clave) {
  console.log("Tipo buscado:", clave);
  tipoActual = clave;
  mensajeJugar.textContent = "";
  inputPoke.classList.remove("is-invalid");
  marcarBotonActivo(clave);

  // Estado de carga
  botonBuscar.disabled = true;
  botonVerMas.classList.add("d-none");
  infoResultado.textContent = "";
  resultado.innerHTML = `
    <div class="col-12 text-center py-4">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-2">Cargando...</p>
    </div>`;

  try {
    const respuesta = await fetch(`https://pokeapi.co/api/v2/type/${clave}`);
    if (!respuesta.ok) throw new Error("No se pudo obtener el tipo. Intenta de nuevo.");
    const datos = await respuesta.json();

    // Si el usuario ya hizo otra búsqueda mientras esperábamos, ignoramos esta respuesta
    if (clave !== tipoActual) return;

    // Solo pokémon "base" (id menor a 10000), sin formas especiales sin imagen
    listaPokemon = datos.pokemon
      .map((item) => ({
        nombre: item.pokemon.name,
        id: Number(item.pokemon.url.split("/").at(-2)), // el id viene al final de la url
      }))
      .filter((p) => p.id < 10000);

    resultado.innerHTML = "";
    mostrados = 0;
    infoResultado.textContent = `Se encontraron ${listaPokemon.length} Pokémon de tipo ${TIPOS[clave].es}.`;
    mostrarMas();
  } catch (error) {
    resultado.innerHTML = `<p class="text-danger">${error.message}</p>`;
  } finally {
    botonBuscar.disabled = false;
  }
}

// 4.- Mostrar en pantalla los siguientes 20 pokémon
function mostrarMas() {
  const siguientes = listaPokemon.slice(mostrados, mostrados + POR_PAGINA);
  const color = TIPOS[tipoActual].color;

  siguientes.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";
    col.innerHTML = `
      <div class="card text-center shadow-sm h-100 card-poke" style="border-top-color: ${color}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png"
             class="card-img-top" alt="${p.nombre}" loading="lazy">
        <div class="card-body">
          <small class="text-muted">#${String(p.id).padStart(3, "0")}</small>
          <h5 class="card-title text-capitalize mb-0">${p.nombre.replace(/-/g, " ")}</h5>
        </div>
      </div>`;

    // Si la imagen no existe, mostramos el logo de PokéAprende
    const img = col.querySelector("img");
    img.addEventListener("error", () => { img.src = "PA.png"; }, { once: true });

    resultado.appendChild(col);
  });

  mostrados += siguientes.length;

  // Mostrar u ocultar el botón "Ver más"
  if (mostrados < listaPokemon.length) {
    botonVerMas.textContent = `Ver más (${listaPokemon.length - mostrados} restantes)`;
    botonVerMas.classList.remove("d-none");
  } else {
    botonVerMas.classList.add("d-none");
  }
}

botonVerMas.addEventListener("click", mostrarMas);

// Resaltar el botón del tipo que se está viendo
function marcarBotonActivo(clave) {
  contenedorTipos.querySelectorAll(".chip-tipo").forEach((boton) => {
    boton.classList.toggle("activo", boton.dataset.tipo === clave);
  });
}

// ===== SECCIÓN CONTACTO =====
function validarForm()
{
  const inputNombre = document.getElementById("nombre").value;
  const inputCorreo = document.getElementById("correo").value;
  const inputMensaje = document.getElementById("mensaje").value;
  const inputUsuario = document.getElementsByName("usuario");

  console.log("----------------------");
  console.log("Nombre: " + inputNombre);
  console.log("Correo: " + inputCorreo);
  console.log("Usuario: estudiante=", inputUsuario[0].checked, "docente=", inputUsuario[1].checked, "apoderado=", inputUsuario[2].checked);
  console.log("Mensaje: " + inputMensaje);

  if(inputNombre.trim()==="" || inputCorreo.trim()==="" || inputMensaje.trim()==="")
  {
    alert("Debe completar todos los campos de texto del formulario");
    console.log("Campo de texto vacio");
    return false;
  }
  else if(inputUsuario[0].checked==false && inputUsuario[1].checked==false && inputUsuario[2].checked==false)
  {
    alert("Debe seleccionar una alternativa de usuario");
    console.log("Alternativas vacias");
    return false;
  }
  else
  {
    alert("Formulario enviado exitosamente");
  }
}