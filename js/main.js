document.addEventListener("DOMContentLoaded", () => {
  // ----- VARIABLES -----
  const nombre = localStorage.getItem('nombreBorrego') || "Jugador";
  const nombreSpan = document.getElementById('nombre-borrego');
  const borrego = document.getElementById('borrego');
  const borregoContenedor = document.getElementById('borrego-contenedor');
  const obstaculoContainer = document.getElementById('obstaculo');
  const preguntaTexto = document.getElementById('pregunta-texto');
  const respuestasContainer = document.getElementById('respuestas');
  const banderaMeta = document.getElementById('bandera-meta');
  const db = firebase.database();

  let borregoId = null;
  let tiempoInicio = Date.now();
  let aciertos = 0;
  let preguntaIndex = 0;

  // ----- NUEVO: ESTADO DE JUEGO -----
  let estadoJuego = "espera"; // "espera", "animacion", "jugando"
  let intervaloGlobal = null;
  let cronometroAnimacion = null;

  // ----- CREAR MENSAJE DE ESPERA -----
  const mensajeEspera = document.createElement("div");
  mensajeEspera.id = "mensaje-espera";
  mensajeEspera.style.position = "fixed";
  mensajeEspera.style.top = "0";
  mensajeEspera.style.left = "0";
  mensajeEspera.style.width = "100vw";
  mensajeEspera.style.height = "100vh";
  mensajeEspera.style.background = "rgba(255,255,255,0.96)";
  mensajeEspera.style.display = "flex";
  mensajeEspera.style.flexDirection = "column";
  mensajeEspera.style.alignItems = "center";
  mensajeEspera.style.justifyContent = "center";
  mensajeEspera.style.zIndex = "9999";
  mensajeEspera.innerHTML = `
    <h2 style="font-size:2rem; margin-bottom: 2rem;">El juego iniciará pronto</h2>
    <div id="cuenta-inicio" style="font-size:6rem;font-weight:bold;">5</div>
  `;
  document.body.appendChild(mensajeEspera);

  // ----- MARCADOR VISUAL DE STRIKES -----
  const strikesDiv = document.createElement('div');
  strikesDiv.id = "strikes";
  strikesDiv.style.position = "absolute";
  strikesDiv.style.top = "20px";
  strikesDiv.style.left = "20px";
  strikesDiv.style.fontSize = "2.5rem";
  strikesDiv.style.color = "#e74c3c";
  strikesDiv.style.fontWeight = "bold";
  strikesDiv.textContent = ""; // Ningún strike al inicio
  document.body.appendChild(strikesDiv);

  // ----- OBTENER BORREGO ID -----
  db.ref('borregos').orderByChild('nombre').equalTo(nombre).once('value', snapshot => {
    if (snapshot.exists()) {
      borregoId = Object.keys(snapshot.val())[0];
    }
  });

  // ----- FUNCIONES DE PREGUNTAS Y JUEGO -----
  const obstaculos = [
    "assets/pantalla-jugador/ob1.svg",
    "assets/pantalla-jugador/ob2.svg",
    "assets/pantalla-jugador/ob3.svg",
    "assets/pantalla-jugador/ob4.svg",
    "assets/pantalla-jugador/ob5.svg",
    "assets/pantalla-jugador/ob6.svg"
  ];

  const preguntas = [
    // Tus preguntas aquí...
    { q: "¿Cómo se llama el diseñador de la nueva colaboración de Coalesse?", opciones: ["Nuvo Petit", "Be Free", "Jean Nouvel", "Campire"], correcta: "Jean Nouvel" },
    { q: "¿Cómo se llama el nuevo vecindario al que nos mudamos en Chicago para la muestra de Design Days?", opciones: ["Merchandise", "Fulton Market", "The loop", "River North"], correcta: "Fulton Market" },
    { q: "¿Cuál es el título de la revista Work Better más reciente?", opciones: ["360", "Joy at Work", "Community at Work", "Community Based Design"], correcta: "Community at Work" },
    { q: "¿Cuál de estas marcas pertenece a Steelcase?", opciones: ["Viccarbe", "Flos", "Tom Dixon", "West Elm"], correcta: "Viccarbe" },
    { q: "¿Cuál de nuestras sillas tiene el 30% de contenido reciclado?", opciones: ["Gesture", "Leap", "Think", "Series 1"], correcta: "Series 1" },
     { q: "¿Cuál de estos no es un distrito propuesto por el enfoque en crear comunidad?", opciones: ["Urban Parks", "City Center", "Mall district", "Business District"], correcta: "Mall district" },
      { q: "¿Para qué año Steelcase se compromete a cortar las emisiones de carbono por encima del 90%?", opciones: ["2030", "2050", "2060", "2040"], correcta: "2050" },
       { q: "¿En qué año fue fabricada Loop to Loop, la primera tela fabricada con textiles reciclados?", opciones: ["2011", "2013", "2003", "2018"], correcta: "2013" },
        { q: "¿Qué porcentaje de los colaboradores utiliza IA en el trabajo, según los cuatro macrocambios?", opciones: ["56%", "66%", "80%", "75%"], correcta: "75%" },
         { q: "¿Cuál fue el primer producto patentado por The Metal Office Furniture Company en 1912, desarrollado por su cofundador Peter M. Wege?", opciones: ["Migration Desk", "Think Chair", "Victor", "Collection"], correcta: "Victor" },
  ];

  // --------------- SINCRONIZACIÓN INICIO GLOBAL ----------------
  function iniciarEsperaGlobal() {
    // Reinicia el cronómetro invisible a 50 segundos cada vez que alguien entra
    db.ref('startCountdown').set(50);

    // Empieza a escuchar el valor del cronómetro
    intervaloGlobal = setInterval(() => {
      db.ref('startCountdown').once('value', snap => {
        let valor = snap.val();
        if (valor > 0) {
          db.ref('startCountdown').set(valor - 1);
        } else if (valor === 0 && estadoJuego === "espera") {
          clearInterval(intervaloGlobal);
          estadoJuego = "animacion";
          lanzarAnimacionCuenta();
        }
      });
    }, 1000);
  }

  // --------------- ANIMACIÓN 5-4-3-2-1 ----------------
  function lanzarAnimacionCuenta() {
    let cuenta = 5;
    const cuentaDiv = document.getElementById("cuenta-inicio");
    cuentaDiv.textContent = cuenta;

    cronometroAnimacion = setInterval(() => {
      cuenta--;
      if (cuenta > 0) {
        cuentaDiv.textContent = cuenta;
      } else {
        clearInterval(cronometroAnimacion);
        mensajeEspera.remove();
        if (nombreSpan) nombreSpan.textContent = nombre; // <--- Para que siempre se vea el nombre
        estadoJuego = "jugando";
        iniciarJuegoReal();
      }
    }, 1000);
  }

  // --------------- INICIALIZAR EL JUEGO (solo cuando ya terminó la animación) ---------------
  function iniciarJuegoReal() {
    mostrarStrikes(0); // Limpia el marcador visual
    if (borregoId) db.ref(`borregos/${borregoId}/errores`).set(0); // Limpia en DB
    cargarPregunta();
    generarObstaculo();
    setInterval(checkCollision, 50);
    spawnFuegos();
  }

  // ----------- FUNCIONES DE JUEGO (SOLO PERMITIDAS SI estadoJuego ES "jugando") -----------
  function cargarPregunta() {
  if (estadoJuego !== "jugando") return;

  const actual = preguntas[preguntaIndex];
  preguntaTexto.textContent = actual.q;
  respuestasContainer.innerHTML = "";
  actual.opciones.forEach(op => {
    const btn = document.createElement("button");
    btn.classList.add("respuesta");
    btn.textContent = op;
    btn.addEventListener("click", () => verificarRespuesta(op));
    respuestasContainer.appendChild(btn);
  });

  // --- FIX DEFINITIVO: Forzar que ningún botón quede con focus ---
  setTimeout(() => {
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.height = '0px';
    input.style.width = '0px';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    input.focus();
    setTimeout(() => {
      input.remove();
    }, 50);
  }, 20);
}


  function verificarRespuesta(opcion) {
    if (estadoJuego !== "jugando") return;

    const correcta = preguntas[preguntaIndex].correcta;
    if (opcion === correcta) {
      aciertos++;
      saltoAlto();
      actualizarProgreso();
      setTimeout(() => {
        preguntaIndex++;
        if (preguntaIndex < preguntas.length) {
          cargarPregunta();
          generarObstaculo();
        } else {
          mostrarMeta();
        }
      }, 600);
    } else {
      mostrarPerdida();
    }
  }

  function actualizarProgreso() {
    if (!borregoId) return;
    db.ref(`borregos/${borregoId}`).once("value", snapshot => {
      const actual = snapshot.val();
      const nuevo = Math.min((actual.progreso || 0) + 10, 100);
      db.ref(`borregos/${borregoId}/progreso`).set(nuevo);
    });
  }

  function mostrarMeta() {
    banderaMeta.style.display = "block";
    banderaMeta.classList.add("meta-mover");
    preguntaTexto.textContent = "¡Llegaste, sí le sabes a Steelcase!";
    respuestasContainer.innerHTML = "";

    borregoContenedor.classList.remove("borrego-caminando");
    borregoContenedor.classList.add("borrego-gana");

    const tiempoFin = Date.now();
    const tiempoTotal = tiempoFin - tiempoInicio;

    if (borregoId) {
      db.ref(`borregos/${borregoId}`).update({
        progreso: 100,
        estado: "vivo",
        tiempo: tiempoTotal,
        aciertos: aciertos
      });
    }
  }

  // --------- SISTEMA DE 3 STRIKES ---------
 function mostrarPerdida() {
  if (borregoId) {
    db.ref(`borregos/${borregoId}/errores`).once('value', snap => {
      let errores = snap.val() || 0;
      errores++; // Sumar un strike

      mostrarStrikes(errores); // Visual
      db.ref(`borregos/${borregoId}/errores`).set(errores);

      if (errores >= 3) {
        // TERCER ERROR: pierdes (aquí sí muestra animación perdedor y pausa todo)
        borrego.src = "assets/pantalla-jugador/borrego-perdedor.svg";
        preguntaTexto.textContent = "No pusiste atención";
        respuestasContainer.innerHTML = "";

        const tiempoFin = Date.now();
        const tiempoTotal = tiempoFin - tiempoInicio;

        db.ref(`borregos/${borregoId}`).update({
          estado: "muerto",
          tiempo: tiempoTotal,
          aciertos: aciertos
        });

        const ob = obstaculoContainer.querySelector("img");
        if (ob) ob.style.animationPlayState = "paused";
      } else {
        // Menos de 3 errores: muestra mensaje pero NO avanza de pregunta
        preguntaTexto.textContent = "¡Error! Sigue intentando...";
        respuestasContainer.innerHTML = "";

        // --- Espera 1.2 segundos y vuelve a cargar la misma pregunta ---
        setTimeout(() => {
          cargarPregunta();
        }, 1200); // Puedes ajustar el tiempo a tu gusto
      }
    });
  }
}

  // ----------- FUNCION VISUAL DE X ---------
  function mostrarStrikes(n) {
    let str = "";
    for (let i = 0; i < n; i++) str += "❌ ";
    strikesDiv.textContent = str;
  }

  // ----------- OTRAS FUNCIONES DEL JUEGO -----------
  function saltoAlto() {
    borrego.classList.add("saltar");
    setTimeout(() => borrego.classList.remove("saltar"), 500);
  }

  function generarObstaculo() {
    const randomOb = obstaculos[Math.floor(Math.random() * obstaculos.length)];
    obstaculoContainer.innerHTML = "";

    const obImg = document.createElement("img");
    obImg.src = randomOb;
    obImg.classList.add("obstaculo-animado");
    obstaculoContainer.appendChild(obImg);
  }

  function checkCollision() {
    const ob = obstaculoContainer.querySelector("img");
    if (!ob) return;

    const borRect = borrego.getBoundingClientRect();
    const obRect = ob.getBoundingClientRect();

    const colisiona = (
      borRect.x < obRect.x + obRect.width &&
      borRect.x + borRect.width > obRect.x &&
      borRect.y < obRect.y + obRect.height &&
      borRect.y + borRect.height > obRect.y
    );

    if (colisiona) {
      ob.classList.add("retroceder");
      setTimeout(() => ob.classList.remove("retroceder"), 300);
    }
  }

  function spawnFuegos() {
    const cont = document.getElementById('fuegos');
    if (!cont) return;
    const tipos = ['s1', 's2', 's3'];
    for (let i = 0; i < 12; i++) {
      const f = document.createElement('img');
      f.src = `assets/pantalla-final/${tipos[Math.floor(Math.random() * tipos.length)]}.svg`;
      f.style.left = (Math.random() * 90) + '%';
      f.style.top = (Math.random() * 30) + '%';
      f.style.animationDelay = (Math.random() * 1.5) + 's';
      cont.appendChild(f);
    }
  }


  // --------- INICIAR ESPERA GLOBAL AL CARGAR LA PÁGINA -----------
  iniciarEsperaGlobal();
});







