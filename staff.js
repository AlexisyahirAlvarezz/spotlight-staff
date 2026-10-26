document.addEventListener('DOMContentLoaded', function() {
    
    if (localStorage.getItem('staffLogueado') !== 'true') { window.location.href = "login"; return; }
    
    const nombreStaff = localStorage.getItem('nombreStaff');
    const rolStaff = localStorage.getItem('rolStaff');
    document.getElementById('nombreStaff').textContent = nombreStaff;
    document.getElementById('avatarLetra').textContent = nombreStaff.charAt(0).toUpperCase();
    document.getElementById('rolStaff').textContent = rolStaff;

    const esGerente = (rolStaff === "Gerente General" || rolStaff === "Gerente de Marketing");
    
    // CANDADO: Jair (Finanzas) también tiene acceso a los gastos
    const esFinanzas = (rolStaff === "Jefe de Finanzas" || rolStaff === "Jefa de Finanzas" || nombreStaff === "Jair");
    const puedeVerGastos = esGerente || esFinanzas;

    if (esGerente) {
        if(document.getElementById('btnMostrarFormTarea')) document.getElementById('btnMostrarFormTarea').style.display = 'flex';
        if(document.getElementById('btnMostrarFormProyecto')) document.getElementById('btnMostrarFormProyecto').style.display = 'flex';
        if(document.getElementById('btnMostrarFormExamen')) document.getElementById('btnMostrarFormExamen').style.display = 'flex';
        if(document.getElementById('btnMostrarFormAnuncio')) document.getElementById('btnMostrarFormAnuncio').style.display = 'flex';
        if(document.getElementById('btnMostrarFormDirectorio')) document.getElementById('btnMostrarFormDirectorio').style.display = 'flex';
        if(document.getElementById('btnMostrarFormObjetivo')) document.getElementById('btnMostrarFormObjetivo').style.display = 'flex';
    }

    window.toggleForm = function(idFormulario) {
        const form = document.getElementById(idFormulario);
        if (form) {
            if (form.style.display === 'none' || form.style.display === '') { form.style.display = 'flex'; } 
            else { form.style.display = 'none'; }
        }
    };

    // ==========================================
    // CONFIGURACIÓN DE FIREBASE
    // ==========================================
    const firebaseConfig = {
        apiKey: "AIzaSyD0b-S3Qo28sJzuJr-Sb-90_OqDzeJ0o1Q",
        authDomain: "spotlight-produccion.firebaseapp.com",
        projectId: "spotlight-produccion",
        storageBucket: "spotlight-produccion.firebasestorage.app",
        messagingSenderId: "354006255162",
        appId: "1:354006255162:web:4241b9eca93f953c0e1703",
        measurementId: "G-7F8T5TSHHZ"
    };

    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const db = firebase.firestore();

    const CLOUDINARY_CLOUD_NAME = "jc1rzsyt"; 
    const CLOUDINARY_UPLOAD_PRESET = "spotlight_uploads"; 

    // ================= NOTIFICACIONES =================
    let notificaciones = JSON.parse(localStorage.getItem('notificacionesSpotlight')) || [];
    const btnNotificaciones = document.getElementById('btnNotificaciones');
    const panelNotificaciones = document.getElementById('panelNotificaciones');
    const listaNotificaciones = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('badgeNotificaciones');

    function renderNotificaciones() {
        if(!listaNotificaciones) return;
        const misNotificaciones = notificaciones.filter(n => n.para === nombreStaff);
        const noLeidas = misNotificaciones.filter(n => !n.leida).length;
        if (noLeidas > 0) { badge.textContent = noLeidas; badge.style.display = 'flex'; } else { badge.style.display = 'none'; }
        listaNotificaciones.innerHTML = '';
        if (misNotificaciones.length === 0) { listaNotificaciones.innerHTML = '<li>No tienes notificaciones nuevas.</li>'; } 
        else { misNotificaciones.forEach(n => { listaNotificaciones.innerHTML += `<li style="${!n.leida ? 'color: #fff; font-weight: bold;' : ''}">${n.mensaje}</li>`; }); }
    }
    renderNotificaciones();

    if (btnNotificaciones) {
        btnNotificaciones.addEventListener('click', () => {
            panelNotificaciones.style.display = panelNotificaciones.style.display === 'block' ? 'none' : 'block';
            notificaciones.forEach(n => { if(n.para === nombreStaff) n.leida = true; });
            localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
            renderNotificaciones();
        });
    }

    function crearNotificacion(para, mensaje) {
        notificaciones.push({ id: Date.now(), para, mensaje, leida: false });
        localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
        if (para === nombreStaff) renderNotificaciones();
    }

    // ================= SISTEMA DE LOGROS =================
    const DICCIONARIO_LOGROS = {
        'El Incansable': { icono: '🥇', desc: 'Completar 10 tareas' },
        'El Creativo': { icono: '🎬', desc: 'Subir archivos a 5 tareas' },
        'El Cerebrito': { icono: '🧠', desc: 'Sacar 100% en un examen' },
        'El Inspirador': { icono: '🖼️', desc: 'Subir 5 imágenes al Moodboard' }
    };

    function otorgarLogro(logro, usuario) {
        db.collection("directorio").where("nombre", "==", usuario).get().then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                const data = querySnapshot.docs[0].data();
                let logrosActuales = data.logros || [];
                
                if (!logrosActuales.includes(logro)) {
                    logrosActuales.push(logro);
                    db.collection("directorio").doc(docId).update({ logros: logrosActuales }).then(() => {
                        crearNotificacion(usuario, `¡Has desbloqueado la medalla: ${logro}! ${DICCIONARIO_LOGROS[logro].icono}`);
                        if (usuario === nombreStaff) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); }
                    });
                }
            }
        });
    }

    function evaluarLogros() {
        let tareasCompletadas = 0; let tareasConArchivos = 0;
        tareas.forEach(t => {
            if (t.asignado === nombreStaff && t.estado === 'completed') tareasCompletadas++;
            if (t.asignado === nombreStaff && t.archivos && t.archivos.length > 0) tareasConArchivos++;
        });

        if (tareasCompletadas >= 10) otorgarLogro('El Incansable', nombreStaff);
        if (tareasConArchivos >= 5) otorgarLogro('El Creativo', nombreStaff);
        if (resultadosDB.some(r => r.alumno === nombreStaff && r.porcentaje === 100)) otorgarLogro('El Cerebrito', nombreStaff);
        if (moodboardDB.filter(m => m.autor === nombreStaff).length >= 5) otorgarLogro('El Inspirador', nombreStaff);
    }

    // ================= MOODBOARD =================
    const gridMoodboard = document.getElementById('gridMoodboard');
    let moodboardDB = [];

    db.collection("moodboard").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        moodboardDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMoodboard(); evaluarLogros();
    });

    window.renderMoodboard = function() {
        if(!gridMoodboard) return;
        gridMoodboard.innerHTML = '';
        if (moodboardDB.length === 0) {
            gridMoodboard.innerHTML = '<p style="color:#666;">El muro está vacío. ¡Sube la primera imagen de inspiración!</p>';
            return;
        }
        moodboardDB.forEach(img => {
            const botonEliminar = esGerente || img.autor === nombreStaff ? `<button class="moodboard-delete" onclick="eliminarMoodboard('${img.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            gridMoodboard.innerHTML += `
                <div class="moodboard-card">
                    ${botonEliminar}
                    <img src="${img.url}" class="moodboard-img" alt="Referencia">
                    <div class="moodboard-info">
                        <div class="moodboard-titulo">${img.titulo}</div>
                        <div class="moodboard-autor">Subido por: ${img.autor}</div>
                    </div>
                </div>
            `;
        });
    }

    if(document.getElementById('btnGuardarMoodboard')) {
        document.getElementById('btnGuardarMoodboard').addEventListener('click', async () => {
            const titulo = document.getElementById('moodboardTitulo').value;
            const fileInput = document.getElementById('moodboardFoto');
            const boton = document.getElementById('btnGuardarMoodboard');

            if (titulo && fileInput.files.length > 0) {
                const file = fileInput.files[0]; const formData = new FormData();
                formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                boton.innerHTML = "Subiendo..."; boton.disabled = true;
                try {
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                    const data = await response.json();
                    if (data.secure_url) {
                        db.collection("moodboard").add({ titulo, url: data.secure_url, autor: nombreStaff, timestamp: Date.now() }).then(() => {
                            document.getElementById('formNuevoMoodboard').style.display = 'none';
                            document.getElementById('moodboardTitulo').value = ''; fileInput.value = '';
                        });
                    }
                } catch (error) { alert("Error al subir."); }
                boton.innerHTML = "Guardar en el Muro"; boton.disabled = false;
            } else { alert("Escribe un título y selecciona una imagen."); }
        });
    }

    window.eliminarMoodboard = function(id) { if (confirm("¿Eliminar esta referencia?")) { db.collection("moodboard").doc(id).delete(); } };

    // ================= OBJETIVOS EN EQUIPO =================
    const listaObjetivos = document.getElementById('listaObjetivos');
    let objetivosDB = [];

    db.collection("metas").onSnapshot((snapshot) => {
        objetivosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderObjetivos();
    });

    window.renderObjetivos = function() {
        if(!listaObjetivos) return;
        listaObjetivos.innerHTML = '';
        if (objetivosDB.length === 0) { listaObjetivos.innerHTML = '<p style="color:#666;">No hay objetivos activos. ¡Crea uno para motivar al equipo!</p>'; return; }
        objetivosDB.forEach(meta => {
            const porcentaje = Math.min(Math.round((meta.progreso / meta.metaTotal) * 100), 100);
            const estaCompleto = porcentaje >= 100;
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarObjetivo('${meta.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
            let botonAccion = estaCompleto ? `<button class="btn-aportar completado" disabled><i class="fa-solid fa-trophy"></i> ¡Meta Cumplida!</button>` : `<button class="btn-aportar" onclick="aportarProgreso('${meta.id}', ${meta.progreso}, ${meta.metaTotal})"><i class="fa-solid fa-hand-holding-heart"></i> ¡Aportar Avance +1!</button>`;

            listaObjetivos.innerHTML += `
                <div class="objetivo-card ${estaCompleto ? 'completado' : ''}">
                    <div class="objetivo-titulo">${meta.titulo}${botonEliminar}</div>
                    <div class="objetivo-info"><span>Progreso del equipo</span><span class="objetivo-numero">${meta.progreso} / ${meta.metaTotal}</span></div>
                    <div class="barra-progreso-bg"><div class="barra-progreso-fill ${estaCompleto ? 'completado' : ''}" style="width: ${porcentaje}%;"></div></div>
                    ${botonAccion}
                </div>
            `;
        });
    }

    if(document.getElementById('btnGuardarObjetivo')) {
        document.getElementById('btnGuardarObjetivo').addEventListener('click', () => {
            const titulo = document.getElementById('objetivoTitulo').value;
            const metaTotal = parseInt(document.getElementById('objetivoMeta').value);
            if (titulo && metaTotal > 0) {
                db.collection("metas").add({ titulo, metaTotal, progreso: 0 }).then(() => {
                    document.getElementById('formNuevoObjetivo').style.display = 'none';
                    document.getElementById('objetivoTitulo').value = ''; document.getElementById('objetivoMeta').value = '';
                });
            } else { alert("Escribe un título y una meta mayor a 0."); }
        });
    }

    window.aportarProgreso = function(id, progresoActual, metaTotal) {
        const nuevoProgreso = progresoActual + 1;
        db.collection("metas").doc(id).update({ progreso: nuevoProgreso }).then(() => {
            if (nuevoProgreso >= metaTotal) {
                const duration = 3000; const end = Date.now() + duration;
                (function frame() {
                    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f7c948', '#ff9a3c', '#4CAF50'] });
                    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f7c948', '#ff9a3c', '#4CAF50'] });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            }
        });
    };

    window.eliminarObjetivo = function(id) { if (confirm("¿Eliminar este objetivo?")) { db.collection("metas").doc(id).delete(); } };

    // ================= DIRECTORIO =================
    const gridDirectorio = document.getElementById('gridDirectorio');
    let directorioDB = [];

    db.collection("directorio").onSnapshot((snapshot) => {
        directorioDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderDirectorio();
    });

    window.renderDirectorio = function() {
        if(!gridDirectorio) return;
        gridDirectorio.innerHTML = '';
        directorioDB.forEach(persona => {
            const inicial = persona.nombre.charAt(0).toUpperCase();
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarMiembro('${persona.id}')" style="position: absolute; top: 15px; right: 15px;"><i class="fa-solid fa-trash"></i></button>` : '';
            let avatarHTML = persona.foto ? `<img src="${persona.foto}" class="miembro-avatar-img">` : `<div class="miembro-avatar">${inicial}</div>`;
            let medallasHTML = '';
            if (persona.logros && persona.logros.length > 0) {
                medallasHTML = `<div class="logros-container">`;
                persona.logros.forEach(logroKey => {
                    const info = DICCIONARIO_LOGROS[logroKey];
                    if (info) medallasHTML += `<span class="medalla" title="${info.desc}">${info.icono}</span>`;
                });
                medallasHTML += `</div>`;
            }

            gridDirectorio.innerHTML += `
                <div class="miembro-card">
                    ${botonEliminar}${avatarHTML}
                    <h3 class="miembro-nombre">${persona.nombre}</h3>
                    <span class="miembro-rol">${persona.rol}</span>
                    ${medallasHTML}
                    <div class="miembro-contacto">
                        <span><i class="fa-solid fa-envelope"></i> ${persona.correo}</span>
                        <span><i class="fa-solid fa-phone"></i> ${persona.telefono}</span>
                    </div>
                </div>
            `;
        });
    }

    if(document.getElementById('btnGuardarDirectorio')) {
        document.getElementById('btnGuardarDirectorio').addEventListener('click', async () => {
            const nombre = document.getElementById('dirNombre').value;
            const rol = document.getElementById('dirRol').value;
            const correo = document.getElementById('dirCorreo').value;
            const telefono = document.getElementById('dirTelefono').value;
            const fileInput = document.getElementById('dirFoto');
            const boton = document.getElementById('btnGuardarDirectorio');

            if (nombre && rol) {
                let fotoUrl = "";
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0]; const formData = new FormData();
                    formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    boton.innerHTML = "Subiendo..."; boton.disabled = true;
                    try {
                        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                        const data = await response.json();
                        if (data.secure_url) { fotoUrl = data.secure_url; }
                    } catch (error) { console.log(error); }
                    boton.innerHTML = "Guardar Integrante"; boton.disabled = false;
                }
                db.collection("directorio").add({ nombre, rol, correo: correo || "Sin correo", telefono: telefono || "Sin teléfono", foto: fotoUrl, logros: [] }).then(() => {
                    document.getElementById('formNuevoDirectorio').style.display = 'none';
                    document.getElementById('dirNombre').value = ''; document.getElementById('dirRol').value = ''; document.getElementById('dirCorreo').value = ''; document.getElementById('dirTelefono').value = ''; fileInput.value = '';
                });
            } else { alert("El nombre y el puesto son obligatorios."); }
        });
    }

    window.eliminarMiembro = function(id) { if (confirm("¿Eliminar a este integrante?")) { db.collection("directorio").doc(id).delete(); } };

    // ================= ANUNCIOS =================
    const listaAnuncios = document.getElementById('listaAnuncios');
    let anunciosDB = [];

    db.collection("anuncios").onSnapshot((snapshot) => {
        anunciosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAnuncios();
    });

    window.renderAnuncios = function() {
        if(!listaAnuncios) return;
        listaAnuncios.innerHTML = '';
        if (anunciosDB.length === 0) { listaAnuncios.innerHTML = '<p style="color:#666;">No hay comunicados publicados aún.</p>'; return; }
        const anunciosOrdenados = [...anunciosDB].sort((a, b) => {
            if (a.prioridad === 'Urgente' && b.prioridad !== 'Urgente') return -1;
            if (a.prioridad !== 'Urgente' && b.prioridad === 'Urgente') return 1;
            return b.timestamp - a.timestamp;
        });
        anunciosOrdenados.forEach(a => {
            const esUrgente = a.prioridad === 'Urgente';
            const claseCard = esUrgente ? 'anuncio-urgente' : 'anuncio-normal';
            const badge = esUrgente ? '<span class="badge-urgente">URGENTE 🚨</span>' : '';
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarAnuncio('${a.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
            listaAnuncios.innerHTML += `
                <div class="anuncio-card ${claseCard}">
                    <div class="anuncio-header">
                        <div>${badge}<h3 style="margin-top: 5px;">${a.titulo}</h3><span class="anuncio-fecha">Publicado por: ${a.autor} | ${a.fecha}</span></div>
                        ${botonEliminar}
                    </div>
                    <div class="anuncio-mensaje">${a.mensaje}</div>
                </div>
            `;
        });
    }

    if(document.getElementById('btnGuardarAnuncio')) {
        document.getElementById('btnGuardarAnuncio').addEventListener('click', () => {
            const titulo = document.getElementById('anuncioTitulo').value;
            const mensaje = document.getElementById('anuncioMensaje').value;
            const prioridad = document.getElementById('anuncioPrioridad').value;
            if (titulo && mensaje) {
                const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                db.collection("anuncios").add({ titulo, mensaje, prioridad, autor: nombreStaff, fecha: fechaActual, timestamp: Date.now() }).then(() => {
                    document.getElementById('formNuevoAnuncio').style.display = 'none';
                    document.getElementById('anuncioTitulo').value = ''; document.getElementById('anuncioMensaje').value = '';
                });
            } else { alert("Escribe el título y el mensaje."); }
        });
    }

    window.eliminarAnuncio = function(id) { if (confirm("¿Eliminar este comunicado?")) { db.collection("anuncios").doc(id).delete(); } };

    // ================= EXÁMENES =================
    let examenesDB = [];
    let resultadosDB = [];
    let examenActivoId = null;
    const listaExamenes = document.getElementById('listaExamenes');
    const tablaResultados = document.getElementById('tablaResultados');
    const contenedorPreguntas = document.getElementById('contenedorPreguntas');

    db.collection("examenes").onSnapshot((snapshot) => {
        examenesDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderExamenes();
    });

    db.collection("resultados").onSnapshot((snapshot) => {
        resultadosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderExamenes(); evaluarLogros();
    });

    function crearBloquePregunta() {
        if(!contenedorPreguntas) return;
        const bloque = document.createElement('div');
        bloque.className = 'pregunta-bloque';
        bloque.innerHTML = `
            <input type="text" class="p-pregunta" placeholder="Escribe la pregunta..." style="width: 100%; margin-bottom: 10px;">
            <div style="display: flex; gap: 10px;"><input type="text" class="p-opA" placeholder="Opción A" style="flex:1;"><input type="text" class="p-opB" placeholder="Opción B" style="flex:1;"></div>
            <select class="p-correcta" style="width: 100%; margin-top: 10px; padding: 10px; background: #05050f; color: white; border-radius: 8px; border: 1px solid #333;"><option value="A">Correcta: Opción A</option><option value="B">Correcta: Opción B</option></select>
        `;
        contenedorPreguntas.appendChild(bloque);
    }
    
    if (document.getElementById('contenedorPreguntas')) {
        crearBloquePregunta();
        document.getElementById('btnAgregarPregunta').addEventListener('click', crearBloquePregunta);
        document.getElementById('btnGuardarExamen').addEventListener('click', () => {
            const titulo = document.getElementById('examenTitulo').value;
            const bloques = document.querySelectorAll('.pregunta-bloque');
            const preguntas = [];
            if (!titulo) { alert("El examen necesita un título."); return; }
            bloques.forEach(b => {
                const preg = b.querySelector('.p-pregunta').value;
                const opA = b.querySelector('.p-opA').value;
                const opB = b.querySelector('.p-opB').value;
                const corr = b.querySelector('.p-correcta').value;
                if (preg && opA && opB) { preguntas.push({ pregunta: preg, opcionA: opA, opcionB: opB, correcta: corr }); }
            });
            if (preguntas.length === 0) { alert("Debes llenar al menos una pregunta."); return; }
            db.collection("examenes").add({ titulo, preguntas }).then(() => {
                document.getElementById('examenTitulo').value = ''; contenedorPreguntas.innerHTML = ''; crearBloquePregunta(); 
                document.getElementById('formNuevoExamen').style.display = 'none';
            });
        });
    }

    window.renderExamenes = function() {
        if(!listaExamenes) return;
        listaExamenes.innerHTML = '';
        if(examenesDB.length === 0) { listaExamenes.innerHTML = '<p style="color:#666;">No hay exámenes publicados aún.</p>'; } 
        else {
            examenesDB.forEach((ex) => {
                const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarExamen('${ex.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
                listaExamenes.innerHTML += `
                    <li class="examen-card">
                        <div><h3>${ex.titulo}</h3><p style="color:#a0a0b8; font-size: 0.9rem; margin-top: 5px;">${ex.preguntas.length} preguntas</p></div>
                        <div>${botonEliminar}<button class="btn-primary" onclick="abrirExamenParaResponder('${ex.id}')" style="margin-left: 10px;">Responder</button></div>
                    </li>
                `;
            });
        }
        if (tablaResultados) {
            tablaResultados.innerHTML = '';
            if(resultadosDB.length === 0) { tablaResultados.innerHTML = '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #666;">Aún no hay resultados registrados.</td></tr>'; } 
            else {
                const resOrdenados = [...resultadosDB].sort((a,b) => b.timestamp - a.timestamp);
                resOrdenados.forEach(res => {
                    const color = res.porcentaje >= 70 ? '#4CAF50' : '#ff5e5e';
                    tablaResultados.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 15px; color: white;">${res.alumno}</td><td style="padding: 15px; color: #a0a0b8;">${res.tituloExamen}</td><td style="padding: 15px; font-weight: bold; color: ${color};">${res.porcentaje}% (${res.aciertos}/${res.total})</td></tr>`;
                });
            }
        }
    }

    window.eliminarExamen = function(id) { if (confirm("¿Eliminar este examen?")) { db.collection("examenes").doc(id).delete(); } };

    window.abrirExamenParaResponder = function(id) {
        const examen = examenesDB.find(ex => ex.id === id);
        if(!examen) return;
        examenActivoId = id;
        document.getElementById('mExamenTitulo').textContent = examen.titulo;
        const contenedor = document.getElementById('mExamenPreguntas');
        contenedor.innerHTML = '';
        examen.preguntas.forEach((p, index) => {
            contenedor.innerHTML += `
                <div class="pregunta-bloque">
                    <p style="margin-bottom: 10px; font-weight: bold;">${index + 1}. ${p.pregunta}</p>
                    <label class="opcion-examen"><input type="radio" name="resp_${index}" value="A"> ${p.opcionA}</label>
                    <label class="opcion-examen"><input type="radio" name="resp_${index}" value="B"> ${p.opcionB}</label>
                </div>
            `;
        });
        document.getElementById('modalExamen').style.display = 'flex';
    }

    window.cerrarModalExamen = function() { document.getElementById('modalExamen').style.display = 'none'; }

    if (document.getElementById('btnCalificarExamen')) {
        document.getElementById('btnCalificarExamen').addEventListener('click', () => {
            const examen = examenesDB.find(ex => ex.id === examenActivoId);
            if(!examen) return;
            let aciertos = 0; let todasRespondidas = true;
            examen.preguntas.forEach((p, index) => {
                const seleccion = document.querySelector(`input[name="resp_${index}"]:checked`);
                if (!seleccion) { todasRespondidas = false; } else if (seleccion.value === p.correcta) { aciertos++; }
            });
            if (!todasRespondidas) { alert("Por favor, responde todas las preguntas."); return; }
            const total = examen.preguntas.length;
            const porcentaje = Math.round((aciertos / total) * 100);
            
            db.collection("resultados").add({
                examenId: examen.id, tituloExamen: examen.titulo, alumno: nombreStaff, porcentaje: porcentaje, aciertos: aciertos, total: total, timestamp: Date.now()
            }).then(() => {
                cerrarModalExamen();
                if (porcentaje >= 70) { confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } }); alert(`¡Felicidades ${nombreStaff}! Has aprobado con un ${porcentaje}%. 🎉`); } 
                else { alert(`Obtuviste un ${porcentaje}%. Necesitas al menos 70% para aprobar. 😢`); }
            });
        });
    }

    // ================= PROYECTOS Y GASTOS =================
    const listaProyectos = document.getElementById('listaProyectos'); 
    let proyectosDB = [];

    db.collection("proyectos").onSnapshot((snapshot) => {
        proyectosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProyectosLista();
    });

    window.renderProyectosLista = function() {
        if(!listaProyectos) return;
        listaProyectos.innerHTML = '';
        proyectosDB.forEach(p => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProyecto('${p.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            listaProyectos.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="abrirModalProyecto('${p.nombre}')"><div><i class="fa-solid fa-folder" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${p.nombre}</strong></div>${botonEliminar}</li>`;
        });
    }

    if(document.getElementById('btnGuardarProyecto')) {
        document.getElementById('btnGuardarProyecto').addEventListener('click', () => {
            const nombre = document.getElementById('inputProyectoNom').value;
            const cliente = document.getElementById('inputClienteProyecto').value || "Sin cliente";
            const presupuesto = parseFloat(document.getElementById('inputPresupuestoProyecto').value) || 0;
            
            if (nombre && !proyectosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                db.collection("proyectos").add({ nombre, cliente, presupuesto, gastos: [] }).then(() => {
                    document.getElementById('formNuevoProyecto').style.display = 'none';
                    document.getElementById('inputProyectoNom').value = '';
                    document.getElementById('inputPresupuestoProyecto').value = '';
                });
            } else { alert("El proyecto ya existe o el nombre está vacío."); }
        });
    }

    window.eliminarProyecto = function(id) { if (confirm("¿Eliminar este proyecto?")) { db.collection("proyectos").doc(id).delete(); } };

    let proyectoActivoId = null;

    window.abrirModalProyecto = function(nombreProyecto) {
        const p = proyectosDB.find(proy => proy.nombre === nombreProyecto);
        if (!p) return;
        
        proyectoActivoId = p.id;
        
        document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        
        // Renderizar Tareas
        const lista = document.getElementById('mProyectoTareas'); lista.innerHTML = '';
        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);
        if(tareasDelProyecto.length === 0) { lista.innerHTML = '<p style="color:#666; font-size: 0.9rem;">No hay tareas en este proyecto.</p>'; } 
        else {
            tareasDelProyecto.forEach(t => {
                lista.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer; background: rgba(247, 201, 72, 0.1); border-color: #f7c948;" onclick="cerrarModal(); abrirModalTarea('${t.id}')"><div><i class="fa-solid fa-folder-open" style="color:#f7c948;"></i><strong style="margin-left:10px; color:white;">${t.titulo}</strong></div><div style="display:flex; gap:10px; align-items: center;"><span>Para: ${t.asignado}</span><i class="fa-solid fa-chevron-right"></i></div></li>`;
            });
        }

        // RENDERIZAR GASTOS (SOLO SI TIENE PERMISO)
        const seccionGastos = document.getElementById('seccionGastos');
        if (puedeVerGastos) {
            seccionGastos.style.display = 'block';
            renderGastosProyecto(p);
        } else {
            seccionGastos.style.display = 'none'; // Ocultar para el resto del staff
        }
        
        document.getElementById('modalProyecto').style.display = 'flex';
    }

    function renderGastosProyecto(proyecto) {
        const presupuesto = proyecto.presupuesto || 0;
        const gastos = proyecto.gastos || [];
        const totalGastado = gastos.reduce((sum, g) => sum + g.monto, 0);
        const saldo = presupuesto - totalGastado;
        
        // Llenar el resumen
        document.getElementById('resumenGastos').innerHTML = `
            <div class="resumen-box"><span>Presupuesto</span><strong>$${presupuesto.toFixed(2)}</strong></div>
            <div class="resumen-box"><span>Gastado</span><strong style="color:#ff5e5e">-$${totalGastado.toFixed(2)}</strong></div>
            <div class="resumen-box"><span>Disponible</span><strong class="${saldo < 0 ? 'negativo' : 'positivo'}">$${saldo.toFixed(2)}</strong></div>
        `;

        // Barra de progreso
        let porcentaje = 0;
        if (presupuesto > 0) porcentaje = Math.min((totalGastado / presupuesto) * 100, 100);
        const barra = document.getElementById('barraGastos');
        barra.style.width = `${porcentaje}%`;
        barra.style.background = porcentaje > 90 ? '#ff5e5e' : '#f7c948';

        // Lista de gastos
        const lista = document.getElementById('listaGastos');
        lista.innerHTML = '';
        if (gastos.length === 0) {
            lista.innerHTML = '<p style="color:#666; font-size: 0.9rem;">No hay gastos registrados.</p>';
        } else {
            gastos.forEach((g, index) => {
                lista.innerHTML += `
                    <li class="gasto-item">
                        <span>${g.concepto}</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="gasto-monto">-$${g.monto.toFixed(2)}</span>
                            <button class="gasto-eliminar" onclick="eliminarGasto(${index})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </li>
                `;
            });
        }
    }

    window.agregarGasto = function() {
        const concepto = document.getElementById('gastoConcepto').value;
        const monto = parseFloat(document.getElementById('gastoMonto').value);

        if (concepto && monto > 0) {
            const proyecto = proyectosDB.find(p => p.id === proyectoActivoId);
            let gastosActuales = proyecto.gastos || [];
            gastosActuales.push({ concepto, monto });

            db.collection("proyectos").doc(proyectoActivoId).update({ gastos: gastosActuales }).then(() => {
                document.getElementById('gastoConcepto').value = '';
                document.getElementById('gastoMonto').value = '';
                proyecto.gastos = gastosActuales;
                renderGastosProyecto(proyecto);
            });
        } else { alert("Escribe un concepto y un monto válido."); }
    }

    window.eliminarGasto = function(index) {
        if (confirm("¿Eliminar este gasto?")) {
            const proyecto = proyectosDB.find(p => p.id === proyectoActivoId);
            let gastosActuales = proyecto.gastos || [];
            gastosActuales.splice(index, 1);

            db.collection("proyectos").doc(proyectoActivoId).update({ gastos: gastosActuales }).then(() => {
                proyecto.gastos = gastosActuales;
                renderGastosProyecto(proyecto);
            });
        }
    }

    // ================= TAREAS (TABLERO KANBAN) =================
    let tareas = [];
    let tareaActivaId = null;

    db.collection("tareas").onSnapshot((snapshot) => {
        tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTareas(); evaluarLogros();
    });

    window.renderTareas = function() {
        const colPending = document.getElementById('kanban-pending');
        const colProgress = document.getElementById('kanban-progress');
        const colCompleted = document.getElementById('kanban-completed');
        
        if(!colPending) return;

        colPending.innerHTML = ''; colProgress.innerHTML = ''; colCompleted.innerHTML = '';

        tareas.forEach((t) => {
            const esAsignado = (nombreStaff.trim().toLowerCase() === t.asignado.trim().toLowerCase());
            const etiquetaNota = t.calificacion ? `<span class="nota-tag"><i class="fa-solid fa-star"></i> ${t.calificacion}/10</span>` : '';
            let botonesAccion = '';

            if (t.estado === 'pending') {
                botonesAccion = `<button class="btn-start" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'progress')"><i class="fa-solid fa-play"></i> Empezar</button>`;
            } else if (t.estado === 'progress') {
                const btnReabrir = `<button class="btn-back" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'pending')"><i class="fa-solid fa-rotate-left"></i> Pausar</button>`;
                const btnTerminar = (esAsignado || esGerente) ? `<button class="btn-finish" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'completed')"><i class="fa-solid fa-check"></i> Terminar</button>` : '';
                botonesAccion = btnReabrir + btnTerminar;
            } else if (t.estado === 'completed') {
                botonesAccion = `<button class="btn-back" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'progress')"><i class="fa-solid fa-rotate-left"></i> Reabrir</button>`;
                if (esGerente) {
                    botonesAccion += `<button class="btn-back" onclick="event.stopPropagation(); eliminarTarea('${t.id}')" style="flex: 0.5;"><i class="fa-solid fa-trash"></i></button>`;
                }
            }

            const cardHTML = `
                <div class="kanban-card ${t.estado}" onclick="abrirModalTarea('${t.id}')">
                    <h4>${t.titulo}</h4>
                    <p>Asignado a: <strong>${t.asignado}</strong> <br> Proyecto: ${t.proyecto}</p>
                    ${etiquetaNota}
                    <div class="kanban-actions">${botonesAccion}</div>
                </div>
            `;

            if (t.estado === 'pending') colPending.innerHTML += cardHTML;
            else if (t.estado === 'progress') colProgress.innerHTML += cardHTML;
            else if (t.estado === 'completed') colCompleted.innerHTML += cardHTML;
        });
    }

    window.cambiarEstadoTarea = function(id, nuevoEstado) {
        db.collection("tareas").doc(id).update({ estado: nuevoEstado }).then(() => {
            if (nuevoEstado === 'completed') { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }
        });
    };

    if(document.getElementById('btnGuardarTarea')) {
        document.getElementById('btnGuardarTarea').addEventListener('click', async () => {
            const titulo = document.getElementById('inputTarea').value;
            const asignado = document.getElementById('inputAsignado').value;
            const fecha = document.getElementById('inputFecha').value;
            const proyecto = document.getElementById('inputProyecto').value.trim() || "General";
            const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones.";
            
            if (titulo) {
                if (proyecto !== "General" && !proyectosDB.find(p => p.nombre.toLowerCase() === proyecto.toLowerCase())) {
                    await db.collection("proyectos").add({ nombre: proyecto, cliente: "Sin cliente", presupuesto: 0, gastos: [] });
                }
                db.collection("tareas").add({ titulo, asignado, fecha, estado: 'pending', desc, proyecto, archivos: [], calificacion: null }).then(() => {
                    crearNotificacion(asignado, `Nueva tarea asignada: ${titulo}`);
                    document.getElementById('formNuevaTarea').style.display = 'none';
                    document.getElementById('inputTarea').value = ''; document.getElementById('inputProyecto').value = '';
                });
            } else { alert("Escribe qué hay que hacer."); }
        });
    }

    window.eliminarTarea = function(id) { if (confirm("¿Eliminar tarea?")) { db.collection("tareas").doc(id).delete(); } };

    window.abrirModalTarea = function(id) {
        const t = tareas.find(tarea => tarea.id === id);
        if(!t) return;

        tareaActivaId = id;
        document.getElementById('mTareaTitulo').textContent = t.titulo;
        document.getElementById('mTareaAsignado').textContent = `Asignado a: ${t.asignado} | Fecha: ${t.fecha}`;
        document.getElementById('mTareaDesc').textContent = t.desc;
        
        const calificacionAdmin = document.getElementById('calificacionAdmin');
        const calificacionStaff = document.getElementById('calificacionStaff');
        const textoCalificacion = document.getElementById('textoCalificacion');

        if (esGerente) {
            calificacionAdmin.style.display = 'flex'; calificacionStaff.style.display = 'none';
            document.getElementById('inputCalificacion').value = t.calificacion || '';
        } else {
            calificacionAdmin.style.display = 'none'; calificacionStaff.style.display = 'flex';
            if (t.calificacion) { textoCalificacion.textContent = `${t.calificacion} / 10`; textoCalificacion.style.color = '#4CAF50'; } 
            else { textoCalificacion.textContent = 'Sin calificar aún'; textoCalificacion.style.color = '#a0a0b8'; }
        }

        renderArchivosModal(t); 
        document.getElementById('modalTarea').style.display = 'flex';
    }

    window.guardarCalificacion = function() {
        const nota = document.getElementById('inputCalificacion').value;
        const t = tareas.find(tarea => tarea.id === tareaActivaId);
        if (nota < 1 || nota > 10 || nota === '') { alert("Ingresa una nota del 1 al 10."); return; }
        
        db.collection("tareas").doc(tareaActivaId).update({ calificacion: nota }).then(() => {
            crearNotificacion(t.asignado, `Has recibido una calificación de ${nota}/10 en: ${t.titulo}`);
            alert("Calificación guardada."); cerrarModal();
        });
    }
    
    function renderArchivosModal(tarea) {
        const lista = document.getElementById('mTareaArchivos'); if(!lista) return;
        lista.innerHTML = '';
        const archivos = tarea.archivos || [];
        if(archivos.length === 0) { lista.innerHTML = '<p style="color:#666; font-size:0.85rem;">No hay archivos aún.</p>'; } 
        else {
            archivos.forEach(a => {
                const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/');
                lista.innerHTML += `<li class="archivo-item" style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><a href="${a.url}" target="_blank" style="color: #fff; text-decoration: none;"><i class="fa-solid fa-file" style="color: #f7c948;"></i> ${a.nombre}</a><a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a></li>`;
            });
        }
    }

    window.subirArchivosTarea = async function(event) {
        if (event) event.preventDefault();
        const t = tareas.find(tarea => tarea.id === tareaActivaId);
        const input = document.getElementById('inputArchivoTarea'); if(input.files.length === 0) return;
        
        const boton = document.querySelector('.upload-area button'); const textOrig = boton.innerHTML;
        boton.innerHTML = "Subiendo..."; boton.disabled = true;
        let nuevosArchivos = t.archivos || [];

        for(let i=0; i<input.files.length; i++) {
            const file = input.files[i]; const formData = new FormData();
            formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { nuevosArchivos.push({ nombre: file.name, url: data.secure_url }); } 
            } catch (error) { console.log(error); }
        }
        
        db.collection("tareas").doc(tareaActivaId).update({ archivos: nuevosArchivos }).then(() => {
            boton.innerHTML = textOrig; boton.disabled = false; input.value = '';
            t.archivos = nuevosArchivos; renderArchivosModal(t);
        });
    }
    window.cerrarModal = function() { document.getElementById('modalTarea').style.display = 'none'; document.getElementById('modalProyecto').style.display = 'none'; }

    // ================= CALENDARIO =================
    let eventos = [];
    let fechaCalendario = new Date();

    db.collection("eventos").onSnapshot((snapshot) => {
        eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCalendario(); renderListaEventos();
    });

    window.renderCalendario = function() {
        const grid = document.getElementById('calendarDays'); const display = document.getElementById('monthYearDisplay');
        if(!grid) return;
        grid.innerHTML = '';
        const year = fechaCalendario.getFullYear(); const month = fechaCalendario.getMonth();
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        display.textContent = `${meses[month]} ${year}`;
        const primerDia = new Date(year, month, 1).getDay(); const diasEnMes = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < primerDia; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`;
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const tieneEvento = eventos.some(e => e.fecha === fechaStr);
            grid.innerHTML += `<div class="calendar-day"><span class="day-number">${dia}</span>${tieneEvento ? '<div class="event-dot"></div>' : ''}</div>`;
        }
    }
    
    if(document.getElementById('prevMonth')) {
        document.getElementById('prevMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() - 1); renderCalendario(); });
        document.getElementById('nextMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() + 1); renderCalendario(); });
    }

    function renderListaEventos() {
        const listaEventos = document.getElementById('listaEventos'); if(!listaEventos) return;
        listaEventos.innerHTML = '';
        const evOrdenados = [...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        evOrdenados.forEach(ev => {
            const fechaFormat = new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            listaEventos.innerHTML += `<li class="archivo-item"><i class="fa-solid fa-calendar-check" style="color:#f7c948;"></i><div style="margin-left:10px;"><strong style="color:white; display:block;">${ev.nombre}</strong><span style="font-size:0.85rem; color:#a0a0b8; text-transform: capitalize;">${fechaFormat}</span></div></li>`;
        });
    }

    if(document.getElementById('btnAgendarEvento')) {
        document.getElementById('btnAgendarEvento').addEventListener('click', () => {
            const nombre = document.getElementById('inputEvento').value; const fecha = document.getElementById('inputFechaEvento').value;
            if (nombre && fecha) { db.collection("eventos").add({ nombre, fecha }).then(() => { document.getElementById('inputEvento').value = ''; }); } 
            else { alert("Escribe el nombre y la fecha."); }
        });
    }

    // ================= NAVEGACIÓN =================
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
            this.classList.add('active');
            const target = this.getAttribute('data-target');
            document.getElementById('view-' + target).style.display = 'block';
            
            if (target === 'calendario') renderCalendario();
            if (target === 'examenes') renderExamenes();
            if (target === 'anuncios') renderAnuncios();
            if (target === 'directorio') renderDirectorio();
            if (target === 'objetivos') renderObjetivos();
            if (target === 'moodboard') renderMoodboard();
        });
    });

    document.getElementById('btnLogout').addEventListener('click', function(e) { e.preventDefault(); localStorage.removeItem('staffLogueado'); window.location.href = "login"; });
});