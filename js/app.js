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
const contenedorTipos = document.getElementById("tipos");
const infoResultado = document.getElementById("info-resultado");
const resultado = document.getElementById("resultado");
const botonVerMas = document.getElementById("ver-mas");

let listaPokemon = []; // pokémon del último tipo buscado
let mostrados = 0;     // cuántos ya están en pantalla
let tipoActual = "";   // clave en inglés del tipo buscado

// 1.- Crear un botón por cada tipo
for (const clave in TIPOS) {
  const tipo = TIPOS[clave];

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn btn-sm chip-tipo";
  boton.textContent = tipo.es;
  boton.dataset.tipo = clave;
  boton.style.backgroundColor = tipo.color;
  boton.addEventListener("click", () => buscarTipo(clave));
  contenedorTipos.appendChild(boton);
}

// 2.- Consumir la API y guardar la lista de pokémon del tipo
async function buscarTipo(clave) {
  console.log("Tipo buscado:", clave);
  tipoActual = clave;
  marcarBotonActivo(clave);

  // Estado de carga
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
  }
}

// 3.- Mostrar en pantalla los siguientes 20 pokémon
function mostrarMas() {
  const siguientes = listaPokemon.slice(mostrados, mostrados + POR_PAGINA);
  const color = TIPOS[tipoActual].color;

  siguientes.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";
    col.innerHTML = `
      <div class="card text-center shadow-sm h-100 card-poke" style="border-top-color: ${color}"
           role="button" tabindex="0" data-id="${p.id}" aria-label="Ver características de ${p.nombre}">
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

// ===== MODAL CON CARACTERÍSTICAS DEL POKÉMON =====

const modalPoke = new bootstrap.Modal(document.getElementById("modal-poke"));
const modalHeader = document.getElementById("modal-poke-header");
const modalTitulo = document.getElementById("modal-poke-titulo");
const modalCuerpo = document.getElementById("modal-poke-cuerpo");

// Nombres de las estadísticas en español
const STATS = {
  "hp": "PS",
  "attack": "Ataque",
  "defense": "Defensa",
  "special-attack": "At. Especial",
  "special-defense": "Def. Especial",
  "speed": "Velocidad",
};

// Un solo listener en #resultado sirve para todas las cards (aunque se creen después)
resultado.addEventListener("click", (evento) => {
  const card = evento.target.closest(".card-poke");
  if (card) abrirModal(card.dataset.id);
});

// Para usarlo con teclado: Enter o Espacio sobre una card
resultado.addEventListener("keydown", (evento) => {
  const card = evento.target.closest(".card-poke");
  if (card && (evento.key === "Enter" || evento.key === " ")) {
    evento.preventDefault();
    abrirModal(card.dataset.id);
  }
});

async function abrirModal(id) {
  // Mostrar el modal de inmediato con un spinner mientras carga
  modalTitulo.textContent = "Cargando...";
  modalHeader.style.backgroundColor = "";
  modalCuerpo.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
    </div>`;
  modalPoke.show();

  try {
    // Pedimos los datos del pokémon y de su especie (para la descripción) al mismo tiempo
    const [resPoke, resEspecie] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
    ]);
    if (!resPoke.ok) throw new Error("No se pudieron cargar los datos del Pokémon.");
    const poke = await resPoke.json();
    const especie = resEspecie.ok ? await resEspecie.json() : null;

    mostrarDetalle(poke, especie);
  } catch (error) {
    modalTitulo.textContent = "Error";
    modalCuerpo.innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

function mostrarDetalle(poke, especie) {
  // Tipos con su nombre en español y color
  const tipos = poke.types.map((t) => t.type.name);
  const colorPrincipal = TIPOS[tipos[0]] ? TIPOS[tipos[0]].color : "";
  const htmlTipos = tipos.map((t) => {
    const tipo = TIPOS[t] || { es: t, color: "#777" };
    return `<span class="badge chip-tipo" style="background-color: ${tipo.color}">${tipo.es}</span>`;
  }).join(" ");

  // Descripción en español (si existe)
  let descripcion = "";
  if (especie) {
    const textoEs = especie.flavor_text_entries.find((f) => f.language.name === "es");
    if (textoEs) descripcion = textoEs.flavor_text.replace(/[\n\f]/g, " ");
  }

  // Habilidades
  const habilidades = poke.abilities
    .map((h) => h.ability.name.replace(/-/g, " ") + (h.is_hidden ? " (oculta)" : ""))
    .join(", ");

  // Estadísticas con barras de progreso (el máximo posible es 255)
  const htmlStats = poke.stats.map((s) => {
    const porcentaje = Math.round((s.base_stat / 255) * 100);
    return `
      <div class="d-flex align-items-center mb-1">
        <span class="stat-nombre">${STATS[s.stat.name] || s.stat.name}</span>
        <span class="stat-valor">${s.base_stat}</span>
        <div class="progress flex-grow-1" role="progressbar" aria-valuenow="${s.base_stat}" aria-valuemin="0" aria-valuemax="255">
          <div class="progress-bar" style="width: ${porcentaje}%; background-color: ${colorPrincipal}"></div>
        </div>
      </div>`;
  }).join("");

  // Imagen grande (artwork oficial) o el sprite normal si no existe
  const imagen = poke.sprites.other["official-artwork"].front_default || poke.sprites.front_default || "PA.png";

  modalTitulo.textContent = `#${String(poke.id).padStart(3, "0")} ${poke.name.replace(/-/g, " ")}`;
  modalHeader.style.backgroundColor = colorPrincipal;
  modalCuerpo.innerHTML = `
    <div class="text-center">
      <img src="${imagen}" alt="${poke.name}" class="modal-poke-img">
      <div class="mb-3">${htmlTipos}</div>
      ${descripcion ? `<p class="fst-italic">${descripcion}</p>` : ""}
    </div>
    <div class="row text-center mb-3">
      <div class="col-6">
        <div class="fw-bold">${poke.height / 10} m</div>
        <small class="text-muted">Altura</small>
      </div>
      <div class="col-6">
        <div class="fw-bold">${poke.weight / 10} kg</div>
        <small class="text-muted">Peso</small>
      </div>
    </div>
    <h6>Habilidades</h6>
    <p class="text-capitalize">${habilidades}</p>
    <h6>Estadísticas base</h6>
    ${htmlStats}`;
}

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