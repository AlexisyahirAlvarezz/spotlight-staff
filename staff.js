document.addEventListener('DOMContentLoaded', function() {
    
    // 1. SEGURIDAD
    if (localStorage.getItem('staffLogueado') !== 'true') { window.location.href = "login"; return; }
    
    // 2. DATOS DEL USUARIO
    const nombreStaff = localStorage.getItem('nombreStaff');
    const rolStaff = localStorage.getItem('rolStaff');
    document.getElementById('nombreStaff').textContent = nombreStaff;
    document.getElementById('avatarLetra').textContent = nombreStaff.charAt(0).toUpperCase();
    document.getElementById('rolStaff').textContent = rolStaff;

    const esGerente = (rolStaff === "Gerente General" || rolStaff === "Gerente de Marketing");
    if (esGerente) {
        if(document.getElementById('btnMostrarFormTarea')) document.getElementById('btnMostrarFormTarea').style.display = 'flex';
        if(document.getElementById('btnMostrarFormProyecto')) document.getElementById('btnMostrarFormProyecto').style.display = 'flex';
        if(document.getElementById('btnMostrarFormCliente')) document.getElementById('btnMostrarFormCliente').style.display = 'flex';
        if(document.getElementById('btnMostrarFormExamen')) document.getElementById('btnMostrarFormExamen').style.display = 'flex';
        if(document.getElementById('btnMostrarFormAnuncio')) document.getElementById('btnMostrarFormAnuncio').style.display = 'flex';
        if(document.getElementById('btnMostrarFormDirectorio')) document.getElementById('btnMostrarFormDirectorio').style.display = 'flex';
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

    // ================= NOTIFICACIONES (LOCALES) =================
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
            gridDirectorio.innerHTML += `
                <div class="miembro-card">
                    ${botonEliminar}
                    ${avatarHTML}
                    <h3 class="miembro-nombre">${persona.nombre}</h3>
                    <span class="miembro-rol">${persona.rol}</span>
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
                    const file = fileInput.files[0];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    boton.innerHTML = "Subiendo foto..."; boton.disabled = true;
                    try {
                        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                        const data = await response.json();
                        if (data.secure_url) { fotoUrl = data.secure_url; }
                    } catch (error) { console.log(error); }
                    boton.innerHTML = "Guardar Integrante"; boton.disabled = false;
                }

                db.collection("directorio").add({
                    nombre, rol, correo: correo || "Sin correo", telefono: telefono || "Sin teléfono", foto: fotoUrl 
                }).then(() => {
                    document.getElementById('formNuevoDirectorio').style.display = 'none';
                    document.getElementById('dirNombre').value = ''; document.getElementById('dirRol').value = ''; document.getElementById('dirCorreo').value = ''; document.getElementById('dirTelefono').value = ''; fileInput.value = '';
                });
            } else { alert("El nombre y el puesto son obligatorios."); }
        });
    }

    window.eliminarMiembro = function(id) {
        if (confirm("¿Eliminar a este integrante?")) { db.collection("directorio").doc(id).delete(); }
    };

    // ================= TABLÓN DE ANUNCIOS =================
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
            } else { alert("Por favor, escribe el título y el mensaje."); }
        });
    }

    window.eliminarAnuncio = function(id) {
        if (confirm("¿Eliminar este comunicado?")) { db.collection("anuncios").doc(id).delete(); }
    };

    // ================= SISTEMA DE EXÁMENES =================
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
        renderExamenes();
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
            if (preguntas.length === 0) { alert("Debes llenar al menos una pregunta completa."); return; }
            
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

    window.eliminarExamen = function(id) {
        if (confirm("¿Eliminar este examen?")) { db.collection("examenes").doc(id).delete(); }
    };

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

    // ================= PROYECTOS =================
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
            if (nombre && !proyectosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                db.collection("proyectos").add({ nombre, cliente }).then(() => {
                    document.getElementById('formNuevoProyecto').style.display = 'none';
                    document.getElementById('inputProyectoNom').value = '';
                });
            } else { alert("El proyecto ya existe o el nombre está vacío."); }
        });
    }

    window.eliminarProyecto = function(id) {
        if (confirm("¿Eliminar este proyecto?")) { db.collection("proyectos").doc(id).delete(); }
    };

    // ================= TAREAS =================
    const listaTareas = document.getElementById('listaTareas');
    const listaTareasCompletadas = document.getElementById('listaTareasCompletadas');
    let tareas = [];
    let tareaActivaId = null;

    db.collection("tareas").onSnapshot((snapshot) => {
        tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTareas();
    });

    window.renderTareas = function() {
        if(!listaTareas) return;
        listaTareas.innerHTML = ''; listaTareasCompletadas.innerHTML = '';
        tareas.forEach((t) => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarTarea('${t.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            const esAsignado = (nombreStaff.trim().toLowerCase() === t.asignado.trim().toLowerCase());
            const botonCompletar = (t.estado !== 'completed' && esAsignado) ? `<button class="btn-completar" onclick="event.stopPropagation(); completarTarea('${t.id}')"><i class="fa-solid fa-check"></i></button>` : '';
            const etiquetaNota = t.calificacion ? `<span class="nota-tag"><i class="fa-solid fa-star"></i> ${t.calificacion}/10</span>` : '';

            const html = `
                <div class="task-item" style="justify-content: space-between; ${t.estado === 'completed' ? 'opacity: 0.6;' : ''}" onclick="abrirModalTarea('${t.id}')">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="task-status ${t.estado}"></div>
                        <div class="task-details">
                            <h4>${t.titulo}</h4>
                            <p>Para: ${t.asignado} | Proyecto: ${t.proyecto}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${etiquetaNota}
                        <span class="task-tag">${t.estado}</span>
                        ${botonCompletar}
                        ${botonEliminar}
                    </div>
                </div>
            `;
            if (t.estado === 'completed') { listaTareasCompletadas.innerHTML += html; } else { listaTareas.innerHTML += html; }
        });
    }

    if(document.getElementById('btnGuardarTarea')) {
        document.getElementById('btnGuardarTarea').addEventListener('click', async () => {
            const titulo = document.getElementById('inputTarea').value;
            const asignado = document.getElementById('inputAsignado').value;
            const fecha = document.getElementById('inputFecha').value;
            const proyecto = document.getElementById('inputProyecto').value.trim() || "General";
            const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones.";
            
            if (titulo) {
                if (proyecto !== "General" && !proyectosDB.find(p => p.nombre.toLowerCase() === proyecto.toLowerCase())) {
                    await db.collection("proyectos").add({ nombre: proyecto, cliente: "Sin cliente" });
                }
                db.collection("tareas").add({ titulo, asignado, fecha, estado: 'pending', desc, proyecto, archivos: [], calificacion: null }).then(() => {
                    crearNotificacion(asignado, `Nueva tarea asignada: ${titulo}`);
                    document.getElementById('formNuevaTarea').style.display = 'none';
                    document.getElementById('inputTarea').value = ''; document.getElementById('inputProyecto').value = '';
                });
            } else { alert("Escribe qué hay que hacer."); }
        });
    }

    window.completarTarea = function(id) {
        db.collection("tareas").doc(id).update({ estado: 'completed' }).then(() => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        });
    };
    
    window.eliminarTarea = function(id) { 
        if (confirm("¿Eliminar tarea?")) { db.collection("tareas").doc(id).delete(); } 
    };

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
            calificacionAdmin.style.display = 'flex';
            calificacionStaff.style.display = 'none';
            document.getElementById('inputCalificacion').value = t.calificacion || '';
        } else {
            calificacionAdmin.style.display = 'none';
            calificacionStaff.style.display = 'flex';
            if (t.calificacion) {
                textoCalificacion.textContent = `${t.calificacion} / 10`;
                textoCalificacion.style.color = '#4CAF50';
            } else {
                textoCalificacion.textContent = 'Sin calificar aún';
                textoCalificacion.style.color = '#a0a0b8';
            }
        }

        renderArchivosModal(t); 
        document.getElementById('modalTarea').style.display = 'flex';
    }

    window.guardarCalificacion = function() {
        const nota = document.getElementById('inputCalificacion').value;
        const t = tareas.find(tarea => tarea.id === tareaActivaId);

        if (nota < 1 || nota > 10 || nota === '') {
            alert("Por favor, ingresa una nota válida del 1 al 10.");
            return;
        }
        
        db.collection("tareas").doc(tareaActivaId).update({ calificacion: nota }).then(() => {
            crearNotificacion(t.asignado, `Has recibido una calificación de ${nota}/10 en la tarea: ${t.titulo}`);
            alert("Calificación guardada y notificada exitosamente.");
            cerrarModal();
        });
    }
    
    function renderArchivosModal(tarea) {
        const lista = document.getElementById('mTareaArchivos'); 
        if(!lista) return;
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
            t.archivos = nuevosArchivos;
            renderArchivosModal(t);
        });
    }

    window.abrirModalProyecto = function(nombreProyecto) {
        document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        const lista = document.getElementById('mProyectoTareas'); lista.innerHTML = '';
        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);
        
        if(tareasDelProyecto.length === 0) { lista.innerHTML = '<p style="color:#666;">No hay tareas en este proyecto.</p>'; } 
        else {
            tareasDelProyecto.forEach(t => {
                lista.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer; background: rgba(247, 201, 72, 0.1); border-color: #f7c948;" onclick="cerrarModal(); abrirModalTarea('${t.id}')"><div><i class="fa-solid fa-folder-open" style="color:#f7c948;"></i><strong style="margin-left:10px; color:white;">${t.titulo}</strong></div><div style="display:flex; gap:10px; align-items: center;"><span>Para: ${t.asignado}</span><i class="fa-solid fa-chevron-right"></i></div></li>`;
                if (t.archivos) {
                    t.archivos.forEach(a => {
                        const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/');
                        lista.innerHTML += `<li class="archivo-item" style="margin-left: 20px; border-left: 2px solid #f7c948; background: transparent; display: flex; justify-content: space-between;"><a href="${a.url}" target="_blank" style="color: #a0a0b8; text-decoration: none;"><i class="fa-solid fa-file"></i> ${a.nombre}</a><a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a></li>`;
                    });
                }
            });
        }
        document.getElementById('modalProyecto').style.display = 'flex';
    }
    window.cerrarModal = function() { document.getElementById('modalTarea').style.display = 'none'; document.getElementById('modalProyecto').style.display = 'none'; }

    // ================= CALENDARIO =================
    let eventos = [];
    let fechaCalendario = new Date();

    db.collection("eventos").onSnapshot((snapshot) => {
        eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCalendario();
        renderListaEventos();
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
            if (nombre && fecha) {
                db.collection("eventos").add({ nombre, fecha }).then(() => { document.getElementById('inputEvento').value = ''; });
            } else { alert("Escribe el nombre y la fecha."); }
        });
    }

    // ================= CLIENTES =================
    const listaClientes = document.getElementById('listaClientes'); 
    let clientesDB = [];

    db.collection("clientes").onSnapshot((snapshot) => {
        clientesDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderClientes();
    });

    window.renderClientes = function() {
        if(!listaClientes) return;
        listaClientes.innerHTML = '';
        clientesDB.forEach(cliente => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarCliente('${cliente.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            listaClientes.innerHTML += `<li class="archivo-item" style="justify-content: space-between;"><div><i class="fa-solid fa-building" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${cliente.nombre}</strong></div>${botonEliminar}</li>`;
        });
    }

    if(document.getElementById('btnGuardarCliente')) {
        document.getElementById('btnGuardarCliente').addEventListener('click', () => {
            const nombre = document.getElementById('inputCliente').value;
            if (nombre) { 
                db.collection("clientes").add({ nombre }).then(() => {
                    document.getElementById('formNuevoCliente').style.display = 'none'; 
                    document.getElementById('inputCliente').value = ''; 
                });
            }
        });
    }

    window.eliminarCliente = function(id) { if (confirm("¿Eliminar cliente?")) { db.collection("clientes").doc(id).delete(); } };

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
        });
    });

    document.getElementById('btnLogout').addEventListener('click', function(e) { e.preventDefault(); localStorage.removeItem('staffLogueado'); window.location.href = "login"; });
});