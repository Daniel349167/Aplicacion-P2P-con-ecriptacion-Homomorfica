

let montoEstimadoBase64, interesBase64, tiempoBase64;
const btnsContraer = document.querySelectorAll('.btn-contraer');

btnsContraer.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cardContent = e.target.parentElement.querySelector('.card-content');
        if (cardContent.style.display === 'none') {
            cardContent.style.display = 'block';
            btn.textContent = '-';
        } else {
            cardContent.style.display = 'none';
            btn.textContent = '+';
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    actualizarSolicitudesRecibidas();
    actualizarOfertasRecibidas();
});


const botonSolicitar = document.getElementById("solicitar");
// Evento para el botón de solicitar
botonSolicitar.addEventListener("click", manejarEnvio);

const botonEncriptar = document.getElementById("encriptar");
botonEncriptar.addEventListener("click", encriptarDatos);


function validarCampos(nombre, edad, ingresos, monto) {
    return nombre !== "" && edad !== "" && ingresos !== "" && monto !== "";
}

function manejarEnvio() {
    let nombre = document.getElementById("nombreValue").textContent;

    botonSolicitar.innerHTML = '<div class="spinner"></div>';
    botonSolicitar.disabled = true; 

    // Función para manejar la carga y la lectura de archivos
    function leerArchivo(url, callback) {
        // Se descarga el archivo
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function () {
            var reader = new FileReader();
            reader.onload = function (e) {
                // Cuando la lectura es exitosa, se llama al callback con el texto del archivo
                callback(e.target.result);
            };
            // Se lee el contenido del archivo descargado
            reader.readAsText(xhr.response);
        };
        xhr.open('GET', url);
        xhr.send();
    }

    // Función para enviar los datos al servidor
    function enviarAlServidor(datos) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/solicitar", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                // Quitar el spinner del botón y volver al texto original
                 // Volver a habilitar el botón
    
                if (xhr.status === 200) {
                    let respuesta = JSON.parse(xhr.responseText);
                    if (respuesta.status === "success") {
                        actualizarSolicitudesRecibidas();
                    // Limpiar los campos después de un envío exitoso
                    document.getElementById("nombre").value = "";
                    document.getElementById("edad").value = "";
                    document.getElementById("ingresos").value = "";
                    document.getElementById("historial").value = "excelente";
                    document.getElementById("monto").value = "";

                    document.getElementById("nombreValue").textContent = "";
                    document.getElementById("edadValue").setAttribute('href', '');
                    document.getElementById("ingresosValue").setAttribute('href', '');
                    document.getElementById("historialValue").setAttribute('href', '');
                    document.getElementById("montoValue").setAttribute('href', '');
                    }
                } else {
                    botonSolicitar.innerHTML = 'Solicitar';
                    botonSolicitar.disabled = false;
                }
            }
        };
        xhr.send(datos);
    }

    // Encadenar la lectura de los archivos y el envío de datos
    leerArchivo(document.getElementById("edadValue").getAttribute('href'), function (edadContenido) {
        leerArchivo(document.getElementById("ingresosValue").getAttribute('href'), function (ingresosContenido) {
            leerArchivo(document.getElementById("historialValue").getAttribute('href'), function (historialContenido) {
                leerArchivo(document.getElementById("montoValue").getAttribute('href'), function (montoContenido) {
                    // Aquí tienes el contenido de los archivos y ya puedes enviar los datos
                    let datos = `nombre=${encodeURIComponent(nombre)}&edad=${encodeURIComponent(edadContenido)}&ingresos=${encodeURIComponent(ingresosContenido)}&historial=${encodeURIComponent(historialContenido)}&monto=${encodeURIComponent(montoContenido)}`;
                    // Envía los datos al servidor
                    enviarAlServidor(datos);
                });
            });
        });
    });
}


function actualizarSolicitudesRecibidas() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/getSolicitudes", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let solicitudes = JSON.parse(xhr.responseText);
            // console.log("Solicitudes recibidas:", solicitudes);
            let contenedor = document.getElementById("contenedorSolicitudes");

            contenedor.innerHTML = "";  // Limpiar el contenedor antes de añadir nuevos datos

            for (let i = 0; i < solicitudes.length; i++) {
                let solicitudDiv = document.createElement("div");
                solicitudDiv.className = "solicitudes card";

                // Para 'edad'
                let blobEdad = new Blob([solicitudes[i].edad], { type: "text/plain" });
                let urlEdad = URL.createObjectURL(blobEdad);

                // Para 'ingresos'
                let blobIngresos = new Blob([solicitudes[i].ingresos], { type: "text/plain" });
                let urlIngresos = URL.createObjectURL(blobIngresos);

                // Para 'historial'
                let blobHistorial = new Blob([solicitudes[i].historial], { type: "text/plain" });
                let urlHistorial = URL.createObjectURL(blobHistorial);

                // Para 'monto'
                let blobMonto = new Blob([solicitudes[i].monto], { type: "text/plain" });
                let urlMonto = URL.createObjectURL(blobMonto);

                let contenido = `
                <div class="card-content2">
                  <div class="contenedor-tres-columnas">
                    <div class="columnaSolicitudes" style="flex: 1;">
                        <h2>Solicitud #${i + 1}</h2>
                        <p><strong>Nombre:</strong> ${solicitudes[i].nombre}</p>

                        <p>
                            <strong>Edad:</strong> 
                            <a href="${urlEdad}" download="edad.txt" style="margin-right: 10px;">Descargar</a> 
                        </p>

                        <p>
                            <strong>Ingresos Mensuales:</strong> 
                            <a href="${urlIngresos}" download="ingresos.txt" style="margin-right: 10px;">Descargar</a> 
                        </p>

                        <p>
                            <strong>Historial Crediticio:</strong> 
                            <a href="${urlHistorial}" download="historial.txt" style="margin-right: 10px;">Descargar</a> 
                        </p>

                        <p>
                            <strong>Monto Solicitado:</strong> 
                            <a href="${urlMonto}" download="monto.txt" style="margin-right: 10px;">Descargar</a> 
                        </p>
                        
                        <p>
                            <strong>Llave Pública:</strong> 
                            <a href="https://pruebaconcepto.ddns.net/static/keys/contexto_publico_${solicitudes[i].nombre}.txt" download="Llave_publica_${solicitudes[i].nombre}.txt" style="margin-right: 10px;">
                                Descargar
                            </a> 
                        </p>
                    </div>
                        <div class="columnaSolicitudes border" style="flex: 1;">
                            <h2>Calculadora</h2>
                            <p>
                            <strong>Tasa Base de Interés:</strong>
                            <input type="number" id="tasaBase${i}" value="5" class="sin-margen input-centrado" style="width: 50px;"> 
                            <strong>%</strong>
                        </p>
                        
                        <p>
                            <strong>Factor Monto:</strong>
                            <input type="number" id="factorMonto${i}" value="1" class="sin-margen input-centrado" style="width: 50px;"> 
                            <strong>x10<sup>-4</sup></strong>
                        </p>
                        
                        <p>
                            <strong>Factor Tiempo:</strong>
                            <input type="number" id="factorTiempo${i}" value="2" class="sin-margen input-centrado" style="width: 50px;"> 
                            <strong>x10<sup>-1</sup></strong>
                        </p>
                    
                        
                        <button class="cotizar-btn" data-index="${solicitudes[i].id}">Estimar Préstamo</button>
                        </div>
                        <div class="columnaSolicitudes border" style="flex: 1;">
                            <h2>Ofertar</h2>
                            <p class="inline-field">
                                <strong>Nombre:</strong>
                                <input type="text" id="nombre${i}" class="sin-margen">
                            </p>
                            <p>
                                <strong>Monto Estimado:</strong> 
                                <a href="#" id="montoEstimado${i}" download="montoEstimado.txt" style="margin-right: 10px;"></a>
                            </p>
                    
                            <p>
                                <strong>Interés:</strong> 
                                <a href="#" id="interes${i}" download="interes.txt" style="margin-right: 10px;"></a>
                            </p>
                    
                            <p>
                                <strong>Tiempo de Préstamo:</strong> 
                                <a href="#" id="tiempo${i}" download="tiempo.txt" style="margin-right: 10px;"></a>
                            </p>
                            <button class="ofertar-btn" data-index="${solicitudes[i].id}">Enviar Oferta</button>
                        </div>
                    </div>
                  </div>
                </div>

                `;

                solicitudDiv.innerHTML = contenido;
                contenedor.appendChild(solicitudDiv);

                let btnCotizar = solicitudDiv.querySelector(".cotizar-btn");
                let btnOfertar = solicitudDiv.querySelector(".ofertar-btn");

                btnCotizar.addEventListener('click', function () {
                    const id = this.getAttribute('data-index');
                    estimarPrestamo(id, i);
                });

                btnOfertar.addEventListener('click', function () {
                    const id = this.getAttribute('data-index');
                    btnOfertar.innerHTML = '<div class="spinner"></div>';
                    btnOfertar.disabled = true; 
                    guardarOferta(id, i);
                });

                botonSolicitar.innerHTML = 'Solicitar';
                    botonSolicitar.disabled = false;

            }
        }
    };
    xhr.send();
}

function actualizarOfertasRecibidas() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/getOfertas", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let ofertas = JSON.parse(xhr.responseText);
            let contenedor = document.getElementById("solicitudes-ofertas");
            contenedor.innerHTML = "";

            for (let i = 0; i < ofertas.length; i++) {
                const solicitudData = ofertas[i];
                if (solicitudData.ofertas.length === 0) {
                    continue;
                }
                // Crear Blobs para cada dato de la solicitud
                let blobNombre = new Blob([solicitudData.nombre.toString()], { type: "text/plain" });
                let urlNombre = URL.createObjectURL(blobNombre);

                let blobEdad = new Blob([solicitudData.edad.toString()], { type: "text/plain" });
                let urlEdad = URL.createObjectURL(blobEdad);

                let blobIngresosMensuales = new Blob([solicitudData.ingresos_mensuales.toString()], { type: "text/plain" });
                let urlIngresosMensuales = URL.createObjectURL(blobIngresosMensuales);

                let blobMonto = new Blob([solicitudData.monto.toString()], { type: "text/plain" });
                let urlMonto = URL.createObjectURL(blobMonto);

                let blobHistorialCrediticio = new Blob([solicitudData.historial_crediticio.toString()], { type: "text/plain" });
                let urlHistorialCrediticio = URL.createObjectURL(blobHistorialCrediticio);


                // Crear solicitud
                const solicitudDiv = document.createElement('div');
                solicitudDiv.className = "card-content3";
                const contenido = `
                    <div class="columna-izquierda2 border-derecha">
                    <h3>Solicitud #${i + 1}</h3>
                    <p><strong>Nombre:</strong> ${solicitudData.nombre}</p>  
                    <p>
                        <strong>Edad:</strong> 
                        <a href="${urlEdad}" download="edad.txt" style="margin-right: 10px;">Descargar</a>
                        <span id="edadIcon${i}" class="eye-icon">&#128065;</span>
                        <span id="edad${i}"></span>
                    </p>
                    <p>
                        <strong>Ingresos Mensuales:</strong> 
                        <a href="${urlIngresosMensuales}" download="ingresos.txt" style="margin-right: 10px;">Descargar</a>
                        <span id="ingresosMensualesIcon${i}" class="eye-icon">&#128065;</span>
                        <span id="ingresosMensuales${i}"></span>
                    </p> 
                    <p>
                        <strong>Monto Solicitado:</strong> 
                        <a href="${urlMonto}" download="monto.txt" style="margin-right: 10px;">Descargar</a>
                        <span id="montoIcon${i}" class="eye-icon">&#128065;</span>
                        <span id="monto${i}"></span>
                    </p>
                    <p>
                        <strong>Historial:</strong> 
                        <a href="${urlHistorialCrediticio}" download="historial.txt" style="margin-right: 10px;">Descargar</a>
                        <span id="historialIcon${i}" class="eye-icon">&#128065;</span>
                        <span id="historial${i}"></span>
                    </p>  
                    </div>
                    <div class="columna-derecha2">
                    <h3>Ofertas para esta Solicitud:</h3>
                    <div class="ofertas-solicitud">
                        <!-- Aquí irán las ofertas -->
                    </div>
                    </div>
                `;
                solicitudDiv.innerHTML = contenido;

                contenedor.appendChild(solicitudDiv);

                document.getElementById(`edadIcon${i}`).addEventListener('click', function () {
                    toggleVisibility(`edad${i}`, solicitudData.edad, `${solicitudData.nombre}`, 'oferta');
                });
                document.getElementById(`ingresosMensualesIcon${i}`).addEventListener('click', function () {
                    toggleVisibility(`ingresosMensuales${i}`, solicitudData.ingresos_mensuales, `${solicitudData.nombre}`, 'oferta');
                });
                document.getElementById(`montoIcon${i}`).addEventListener('click', function () {
                    toggleVisibility(`monto${i}`, solicitudData.monto, `${solicitudData.nombre}`, 'oferta');
                });
                document.getElementById(`historialIcon${i}`).addEventListener('click', function () {
                    toggleVisibility(`historial${i}`, solicitudData.historial_crediticio, `${solicitudData.nombre}`, 'oferta');
                });
                // Crear ofertas
                const ofertasCard = document.createElement('div');
                ofertasCard.className = "ofertas-card";

                const totalOfertas = solicitudData.ofertas.length;
                solicitudData.ofertas.forEach((oferta, index) => {
                    // Crear Blobs para cada dato de la oferta
                    let blobMontoOfrecido = new Blob([oferta.montoOfrecido.toString()], { type: "text/plain" });
                    let urlMontoOfrecido = URL.createObjectURL(blobMontoOfrecido);

                    let blobInteresOferta = new Blob([oferta.interesOferta.toString()], { type: "text/plain" });
                    let urlInteresOferta = URL.createObjectURL(blobInteresOferta);

                    let blobTiempoPrestamo = new Blob([oferta.tiempoPrestamo.toString()], { type: "text/plain" });
                    let urlTiempoPrestamo = URL.createObjectURL(blobTiempoPrestamo);

                    const ofertaDiv = document.createElement('div');
                    ofertaDiv.className = "oferta";
                    ofertaDiv.innerHTML = `
                        <h3>Oferta #${index + 1}</h3>
                        <p><strong>Prestamista:</strong> <span>${oferta.prestamista}</span></p>
                        <p>
                            <strong>Monto ofrecido:</strong> 
                            <a href="${urlMontoOfrecido}" download="monto.txt" style="margin-right: 10px;">Descargar</a>
                            <span id="montoOfrecidoIcon${i}${index}" class="eye-icon">&#128065;</span>
                            <span id="montoOfrecido${i}${index}"></span> 
                        </p>
                        <p>
                            <strong>Interés:</strong> 
                            <a href="${urlInteresOferta}" download="interes.txt" style="margin-right: 10px;">Descargar</a>
                            <span id="interesOfertaIcon${i}${index}" class="eye-icon">&#128065;</span>
                            <span id="interesOferta${i}${index}"></span>
                        </p>
                        <p>
                            <strong>Tiempo de préstamo:</strong> 
                            <a href="${urlTiempoPrestamo}" download="tiempo.txt" style="margin-right: 10px;">Descargar</a>
                            <span id="tiempoPrestamoIcon${i}${index}" class="eye-icon">&#128065;</span>
                            <span id="tiempoPrestamo${i}${index}"></span>
                        </p>
                        <button onclick="aceptarOferta(${oferta.id})">Aceptar Oferta</button>
                    `;

                    if (totalOfertas > 1 && index < (totalOfertas - 1)) {
                        ofertaDiv.style.marginBottom = '35px';
                    }

                    ofertasCard.appendChild(ofertaDiv);
                });



                solicitudDiv.querySelector(".ofertas-solicitud").appendChild(ofertasCard);

                solicitudData.ofertas.forEach((oferta, index) => {
                    const montoIcon = document.getElementById(`montoOfrecidoIcon${i}${index}`);
                    const interesIcon = document.getElementById(`interesOfertaIcon${i}${index}`);
                    const tiempoIcon = document.getElementById(`tiempoPrestamoIcon${i}${index}`);


                    montoIcon.addEventListener('click', function () {
                        toggleVisibility(`montoOfrecido${i}${index}`, `${oferta.montoOfrecido}`, `${solicitudData.nombre}`, 'oferta');
                    });

                    interesIcon.addEventListener('click', function () {
                        toggleVisibility(`interesOferta${i}${index}`, `${oferta.interesOferta}`, `${solicitudData.nombre}`, 'oferta');
                    });

                    tiempoIcon.addEventListener('click', function () {
                        toggleVisibility(`tiempoPrestamo${i}${index}`, `${oferta.tiempoPrestamo}`, `${solicitudData.nombre}`, 'oferta');
                    });



                });
                let btnOfertar = document.querySelector('.ofertar-btn');

                btnOfertar.innerHTML = "Enviar Oferta";
                btnOfertar.disabled = false; 

            }
        }
    };
    xhr.send();
}

function toggleVisibility(elementId, datoEncriptado, nombre, tipo = 'solicitud') {
    const element = document.getElementById(elementId);

    // Añadir "Icon" antes de los números XY en elementId para obtener iconElementId
    const iconElementId = elementId.replace(/(\d+)$/, 'Icon$1');
    const iconElement = document.getElementById(iconElementId);

    if (element.innerText === "") {
        // Si el contenido está oculto, muestra el contenido
        if (tipo === 'oferta') {
            mostrarContenidoOfertas(datoEncriptado, elementId, nombre);
        } else {
            mostrarContenido(datoEncriptado, elementId, nombre);
        }

        // Cambia el ícono del ojo a "ojo con línea diagonal"
        iconElement.innerHTML = "&#128065;&#10145;";
    } else {
        // Si el contenido está visible, oculta el contenido
        element.innerText = "";

        // Cambia el ícono del ojo a "ojo normal"
        iconElement.innerHTML = "&#128065;";
    }
}


function mostrarContenido(datoEncriptado, idElemento, nombre) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/desencriptar", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let respuesta = JSON.parse(xhr.responseText);
            let textoMostrar = "";

            if (respuesta.data) {
                // Si el elemento es del historial, traduce el dato desencriptado
                if (idElemento.includes('historial')) {
                    switch (respuesta.data) {
                        case 1:
                            textoMostrar = 'Excelente';
                            break;
                        case 2:
                            textoMostrar = 'Bueno';
                            break;
                        case 3:
                            textoMostrar = 'Regular';
                            break;
                        case 4:
                            textoMostrar = 'Malo';
                            break;
                        default:
                            textoMostrar = 'Desconocido';
                    }
                } else if (idElemento.includes('ingresos') || idElemento.includes('monto')) {
                    textoMostrar = "S/ " + respuesta.data;  // Agregar símbolo de soles

                } else if (idElemento.includes('interes')) {
                    textoMostrar = respuesta.data + " %";  // Agregar símbolo de porcentaje

                } else if (idElemento.includes('tiempo')) {
                    textoMostrar = respuesta.data + " meses";  // Agregar la palabra meses
                } else if (idElemento.includes('edad')) {
                    textoMostrar = respuesta.data + " años";
                } else {
                    // Para otros elementos, usa el dato desencriptado directamente
                    textoMostrar = respuesta.data;
                }

                // Muestra el texto en el elemento
                document.getElementById(idElemento).innerHTML += " " + textoMostrar;
            } else {
                console.error("Error al desencriptar los datos.");
            }
        }
    };

    // Añadir 'nombre' al JSON enviado
    xhr.send(JSON.stringify({ dato: datoEncriptado, nombre: nombre }));
}

function mostrarContenidoOfertas(datoEncriptado, idElemento, nombre) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/desencriptar", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                let respuesta = JSON.parse(xhr.responseText);
                let textoMostrar = "";

                if (respuesta.data) {
                    textoMostrar = respuesta.data;

                    if (idElemento.includes("montoOfrecido")) {
                        textoMostrar = "S/ " + textoMostrar; // Agregar símbolo de soles
                    } else if (idElemento.includes("interesOferta")) {
                        textoMostrar += " %"; // Agregar símbolo de porcentaje
                    } else if (idElemento.includes("tiempoPrestamo")) {
                        textoMostrar += " meses"; // Agregar la palabra meses
                    } else if (idElemento.includes('historial')) {
                        switch (respuesta.data) {
                            case 1:
                                textoMostrar = 'Excelente';
                                break;
                            case 2:
                                textoMostrar = 'Bueno';
                                break;
                            case 3:
                                textoMostrar = 'Regular';
                                break;
                            case 4:
                                textoMostrar = 'Malo';
                                break;
                            default:
                                textoMostrar = 'Desconocido';
                        }
                    }

                    // Muestra el texto en el elemento
                    const element = document.getElementById(idElemento);
                    if (element) {
                        element.textContent = textoMostrar;
                    }
                } else {
                    console.error("Error al desencriptar los datos.");
                }
            } catch (e) {
                console.error("Error al parsear la respuesta del servidor: ", e);
            }
        }
    };

    // Añadir 'nombre' al JSON enviado, aunque aún no está claro para qué se usa
    xhr.send(JSON.stringify({ dato: datoEncriptado, nombre: nombre }));
}





function estimarPrestamo(id, i) {

    let tasaBase = document.getElementById(`tasaBase${i}`).value;
    let factorMonto = document.getElementById(`factorMonto${i}`).value;
    let factorTiempo = document.getElementById(`factorTiempo${i}`).value;

    mostrarLoader(`tiempo${i}`);
    mostrarLoader(`interes${i}`);
    mostrarLoader(`montoEstimado${i}`);

    let data = {
        indice: id,
        tasaBase: tasaBase,
        factorMonto: factorMonto,
        factorTiempo: factorTiempo
    };

    fetch('/calcularPrestamo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            montoEstimadoBase64 = data.monto_final;
            interesBase64 = data.tasa_interes;
            tiempoBase64 = data.tiempo;

            // Crear blobs y URLs como antes para mostrar en la interfaz
            let blobMontoFinal = new Blob([montoEstimadoBase64], { type: "text/plain" });
            let urlMontoFinal = URL.createObjectURL(blobMontoFinal);

            let blobTasaInteres = new Blob([interesBase64], { type: "text/plain" });
            let urlTasaInteres = URL.createObjectURL(blobTasaInteres);

            let blobTiempo = new Blob([tiempoBase64], { type: "text/plain" });
            let urlTiempo = URL.createObjectURL(blobTiempo);

            // Actualizar los elementos de la interfaz
            document.getElementById(`montoEstimado${i}`).href = urlMontoFinal;
            document.getElementById(`interes${i}`).href = urlTasaInteres;
            document.getElementById(`tiempo${i}`).href = urlTiempo;

            document.getElementById(`montoEstimado${i}`).style.display = "inline";
            document.getElementById(`interes${i}`).style.display = "inline";
            document.getElementById(`tiempo${i}`).style.display = "inline";

            document.getElementById(`montoEstimado${i}`).textContent = "Descargar";
            document.getElementById(`interes${i}`).textContent = "Descargar";
            document.getElementById(`tiempo${i}`).textContent = "Descargar";

        })
        .catch(error => {
            console.error('Error al estimar el prestamo:', error);
        });
}

function guardarOferta(id, i) {
    // Obtener el valor del prestamista desde el elemento HTML
    let prestamista = document.getElementById(`nombre${i}`).value;

    // Usar las variables globales que contienen los datos en base64
    let montoEstimado = montoEstimadoBase64;
    let interes = interesBase64;
    let tiempo = tiempoBase64;

    // Preparar los datos que se enviarán al servidor
    let ofertaData = {
        prestamista: prestamista,
        indice: id,
        montoEstimado: montoEstimado,
        interes: interes,
        tiempo: tiempo
    };

    // Realizar la petición al servidor para guardar la oferta
    fetch('/guardarOferta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ofertaData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                actualizarOfertasRecibidas();
            } else {
                // Aquí imprimes el mensaje de error que recibes del servidor
                if (data.error) {
                    console.error("Error del servidor:", data.error);
                }
                let btnOfertar = document.querySelector('.ofertar-btn');

                btnOfertar.innerHTML = "Enviar Oferta";
                btnOfertar.disabled = false; 
                alert("Hubo un error al guardar la oferta");
            }
        })
        .catch(error => {
            // Aquí capturas y muestras errores que podrían ocurrir durante la petición
            let btnOfertar = document.querySelector('.ofertar-btn');

                btnOfertar.innerHTML = "Enviar Oferta";
                btnOfertar.disabled = false; 

            console.error("Error en la petición fetch:", error);
        });
}


function aceptarOferta(idOferta) {
    fetch('/aceptarOferta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "idOferta": idOferta })
    })
        .then(response => response.json())
        .then(data => {
            alert('Mensaje guardado en Tangle con el ID:', data.messageId);
        });
}

function mostrarLoader(elementId) {
    // Crear el elemento div que contendrá el loader
    let loader = document.createElement('div');
    loader.className = 'loader'; // Asignar la clase que definimos en CSS

    // Obtener el elemento que contendrá el loader y asignarle el div del loader
    let container = document.getElementById(elementId);
    container.innerHTML = ''; // Limpiar el contenido previo
    container.appendChild(loader); // Agregar el loader al contenedor
}


function encriptarDatos() {

    // Recoger los valores ingresados por el usuario
    let nombre = document.getElementById('nombre').value;
    let edad = document.getElementById('edad').value;
    let ingresosMensuales = document.getElementById('ingresos').value;
    let historialCrediticio = document.getElementById('historial').value;
    let montoSolicitado = document.getElementById('monto').value;

    // Validar campos antes de encriptar
    if (!validarCampos(nombre, edad, ingresosMensuales, montoSolicitado)) {
        return;
    }

    document.getElementById('nombreValue').textContent = nombre;
    mostrarLoader('edadValue');
    mostrarLoader('ingresosValue');
    mostrarLoader('historialValue');
    mostrarLoader('montoValue');
    mostrarLoader('llaveprivadaValue');
    mostrarLoader('llavepublicaValue');
    botonSolicitar.disabled = true;

    // Crear el objeto con los datos
    let data = {
        nombre: nombre,
        edad: edad,
        ingresos: ingresosMensuales,
        historial: historialCrediticio,
        monto: montoSolicitado
    };

    // Enviar los datos al servidor para su encriptación
    fetch('/encriptar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(dataEncrypted => {
            // Crear blobs y URLs para descargar los datos
            let blobEdad = new Blob([dataEncrypted.edad], { type: "text/plain" });
            let blobIngresos = new Blob([dataEncrypted.ingresos], { type: "text/plain" });
            let blobHistorial = new Blob([dataEncrypted.historial], { type: "text/plain" });
            let blobMonto = new Blob([dataEncrypted.monto], { type: "text/plain" });
            let blobLlavePrivada = new Blob([dataEncrypted.contexto_secreto], { type: "text/plain" });

            // Crear URLs para los blobs
            document.getElementById('edadValue').href = URL.createObjectURL(blobEdad);
            document.getElementById('ingresosValue').href = URL.createObjectURL(blobIngresos);
            document.getElementById('historialValue').href = URL.createObjectURL(blobHistorial);
            document.getElementById('montoValue').href = URL.createObjectURL(blobMonto);
            document.getElementById('llaveprivadaValue').href = URL.createObjectURL(blobLlavePrivada);

            fetch(dataEncrypted.contexto_publico_url)
                .then(response => response.blob()) // Obtener la respuesta como Blob
                .then(blob => {
                    // Crear URL para descargar el Blob
                    const a = document.getElementById('llavepublicaValue');

                    const url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = 'contexto_publico.txt';
                    a.textContent = "Descargar";

                })
                .catch(error => {
                    console.error('Error al descargar la llave pública:', error);
                });

            // Actualizar el texto de los enlaces para indicar que son descargables
            document.getElementById('edadValue').textContent = "Descargar";
            document.getElementById('ingresosValue').textContent = "Descargar";
            document.getElementById('historialValue').textContent = "Descargar";
            document.getElementById('montoValue').textContent = "Descargar";
            document.getElementById('llaveprivadaValue').textContent = "Descargar";
            botonSolicitar.disabled = false;
        })
        .catch(error => {
            console.error('Error al encriptar los datos:', error);
            botonSolicitar.disabled = false;
        });
}
