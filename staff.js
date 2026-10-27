document.addEventListener('DOMContentLoaded', function() {
    
    if (localStorage.getItem('staffLogueado') !== 'true') { window.location.href = "login"; return; }
    
    const nombreStaff = localStorage.getItem('nombreStaff');
    const rolStaff = localStorage.getItem('rolStaff');
    document.getElementById('nombreStaff').textContent = nombreStaff;
    document.getElementById('avatarLetra').textContent = nombreStaff.charAt(0).toUpperCase();
    document.getElementById('rolStaff').textContent = rolStaff;

    const esGerente = (rolStaff === "Gerente General" || rolStaff === "Gerente de Marketing");
    const esFinanzas = (rolStaff === "Jefe de Finanzas" || rolStaff === "Jefa de Finanzas" || nombreStaff === "Jair Lopez" || nombreStaff === "Jair");
    const puedeVerGastos = esGerente || esFinanzas;
    const esMarketing = (rolStaff === "Gerente de Marketing");
    const esRRHH = (nombreStaff === "Ximena Reyes" || nombreStaff === "Ximena" || rolStaff.includes("Recursos Humanos"));
    
    if (esGerente || esRRHH) {
        document.getElementById('link-rrhh').style.display = 'flex';
        if(document.getElementById('link-admin-noti')) document.getElementById('link-admin-noti').style.display = 'flex';
    }
    document.getElementById('link-entregas').style.display = 'flex'; 
    if (esGerente || esMarketing) document.getElementById('link-radar').style.display = 'flex';
    
    if (esGerente) {
        document.getElementById('link-gerencia').style.display = 'flex';
        if(document.getElementById('btnMostrarFormWiki')) document.getElementById('btnMostrarFormWiki').style.display = 'flex';
        if(document.getElementById('btnMostrarFormTarea')) document.getElementById('btnMostrarFormTarea').style.display = 'flex';
        if(document.getElementById('btnMostrarFormProyecto')) document.getElementById('btnMostrarFormProyecto').style.display = 'flex';
        if(document.getElementById('btnMostrarFormExamen')) document.getElementById('btnMostrarFormExamen').style.display = 'flex';
        if(document.getElementById('btnMostrarFormAnuncio')) document.getElementById('btnMostrarFormAnuncio').style.display = 'flex';
        if(document.getElementById('btnMostrarFormDirectorio')) document.getElementById('btnMostrarFormDirectorio').style.display = 'flex';
        if(document.getElementById('btnMostrarFormObjetivo')) document.getElementById('btnMostrarFormObjetivo').style.display = 'flex';
        if(document.getElementById('seccionAdminCanjes')) document.getElementById('seccionAdminCanjes').style.display = 'block';
        if(document.getElementById('btnMostrarFormRecompensa')) document.getElementById('btnMostrarFormRecompensa').style.display = 'flex';
        if(document.getElementById('btnMostrarFormPlantilla')) document.getElementById('btnMostrarFormPlantilla').style.display = 'flex';
    }
    if (esGerente || esFinanzas) document.getElementById('link-boveda').style.display = 'flex';

    if (nombreStaff === "Beatriz Ortiz" || nombreStaff === "Beatriz" || esGerente) { document.getElementById('filtroContainer').style.display = 'block'; }

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    window.toggleForm = function(idFormulario) {
        const form = document.getElementById(idFormulario);
        if (form) { if (form.style.display === 'none' || form.style.display === '') { form.style.display = 'flex'; } else { form.style.display = 'none'; } }
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

    // ================= SISTEMA DE AUDIO Y TOASTS =================
    function playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
            oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); 
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
        } catch(e) { console.log("Audio no soportado"); }
    }

    function mostrarToast(mensaje) {
        const container = document.getElementById('toastContainer'); if(!container) return;
        const toast = document.createElement('div'); toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-bell"></i> <div>${mensaje}</div>`;
        container.appendChild(toast); setTimeout(() => { toast.remove(); }, 5000);
    }

    // ================= NOTIFICACIONES =================
    let notificaciones = [];
    const btnNotificaciones = document.getElementById('btnNotificaciones');
    const panelNotificaciones = document.getElementById('panelNotificaciones');
    const listaNotificaciones = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('badgeNotificaciones');

    db.collection("notificaciones").onSnapshot((snapshot) => {
        const cambios = snapshot.docChanges();
        const todasNotis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtro a prueba de mayúsculas/minúsculas
        notificaciones = todasNotis.filter(n => n.para.trim().toLowerCase() === nombreStaff.trim().toLowerCase())
                                    .sort((a,b) => b.timestamp - a.timestamp);
        
        renderNotificaciones();
        
        cambios.forEach((cambio) => {
            if (cambio.type === "added") {
                const nuevaNoti = cambio.doc.data();
                if (nuevaNoti.para.trim().toLowerCase() === nombreStaff.trim().toLowerCase()) {
                    if (!nuevaNoti.leida && (Date.now() - nuevaNoti.timestamp < 10000)) { 
                        mostrarToast(nuevaNoti.mensaje); 
                        playNotificationSound(); 
                        if (Notification.permission === "granted") {
                            new Notification("SPOTLIGHT", { body: nuevaNoti.mensaje, icon: "logo-blanco.jpg" });
                        }
                    }
                }
            }
        });
    });

    function renderNotificaciones() {
        if(!listaNotificaciones) return;
        const noLeidas = notificaciones.filter(n => !n.leida).length;
        if (noLeidas > 0) { badge.textContent = noLeidas; badge.style.display = 'flex'; } else { badge.style.display = 'none'; }
        listaNotificaciones.innerHTML = '';
        if (notificaciones.length === 0) { listaNotificaciones.innerHTML = '<li>No tienes notificaciones nuevas.</li>'; } 
        else { notificaciones.forEach(n => { listaNotificaciones.innerHTML += `<li style="${!n.leida ? 'color: #fff; font-weight: bold;' : ''}">${n.mensaje}</li>`; }); }
    }
    if (btnNotificaciones) {
        btnNotificaciones.addEventListener('click', () => {
            panelNotificaciones.style.display = panelNotificaciones.style.display === 'block' ? 'none' : 'block';
            notificaciones.forEach(n => { if(!n.leida) db.collection("notificaciones").doc(n.id).update({ leida: true }); });
        });
    }
    function crearNotificacion(para, mensaje) { db.collection("notificaciones").add({ para, mensaje, leida: false, timestamp: Date.now() }); }

    // ================= SISTEMA DE LOGROS Y XP =================
    const DICCIONARIO_LOGROS = {
        'El Incansable': { icono: '🥇', desc: 'Completar 10 tareas' }, 
        'El Creativo': { icono: '🎬', desc: 'Subir archivos a 5 tareas' },
        'El Cerebrito': { icono: '🧠', desc: 'Sacar 100% en un examen' }, 
        'El Inspirador': { icono: '🖼️', desc: 'Subir 5 imágenes al Moodboard' }
    };
    
    function darPuntos(usuario, cantidad) {
        db.collection("directorio").get().then((querySnapshot) => {
            let usuarioEncontrado = null;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.nombre.trim().toLowerCase() === usuario.trim().toLowerCase()) { usuarioEncontrado = { id: doc.id, ...data }; }
            });

            if (usuarioEncontrado) {
                let puntosActuales = usuarioEncontrado.puntos || 0;
                db.collection("directorio").doc(usuarioEncontrado.id).update({ puntos: puntosActuales + cantidad }).then(() => { 
                    crearNotificacion(usuarioEncontrado.nombre, `¡Has ganado +${cantidad} XP! Sigue así. ⚡`); 
                    const index = directorioDB.findIndex(p => p.id === usuarioEncontrado.id);
                    if (index !== -1) directorioDB[index].puntos = puntosActuales + cantidad;
                    renderDashboard(nombreStaff); renderRRHH(); renderHallDeLaFama(); renderDirectorio(); renderTienda();
                });
            }
        });
    }

    function otorgarLogro(logro, usuario) {
        db.collection("directorio").where("nombre", "==", usuario).get().then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id; const data = querySnapshot.docs[0].data(); let logrosActuales = data.logros || [];
                if (!logrosActuales.includes(logro)) {
                    logrosActuales.push(logro); db.collection("directorio").doc(docId).update({ logros: logrosActuales }).then(() => {
                        crearNotificacion(usuario, `¡Has desbloqueado la medalla: ${logro}! ${DICCIONARIO_LOGROS[logro].icono}`);
                        if (usuario === nombreStaff) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); }
                    });
                }
            }
        });
    }
    function evaluarLogros() {
        let tareasCompletadas = 0; let tareasConArchivos = 0;
        tareas.forEach(t => { if (t.asignado === nombreStaff && t.estado === 'completed') tareasCompletadas++; if (t.asignado === nombreStaff && t.archivos && t.archivos.length > 0) tareasConArchivos++; });
        if (tareasCompletadas >= 10) otorgarLogro('El Incansable', nombreStaff);
        if (tareasConArchivos >= 5) otorgarLogro('El Creativo', nombreStaff);
        if (resultadosDB.some(r => r.alumno === nombreStaff && r.porcentaje === 100)) otorgarLogro('El Cerebrito', nombreStaff);
        if (moodboardDB.filter(m => m.autor === nombreStaff).length >= 5) otorgarLogro('El Inspirador', nombreStaff);
    }

    // ================= VARIABLES GLOBALES =================
    let directorioDB = [], resultadosDB = [], tareas = [], proyectosDB = [], examenesDB = [], moodboardDB = [], anunciosDB = [], eventos = [];
    let tiendaDB = [], canjesDB = [], plantillasDB = [], bovedaDB = [], btsDB = [], wikiDB = [], radarDB = [], ideasDB = [];
    let graficoTareasInstance = null, graficoPresupuestoInstance = null;
    let tareaActivaId = null, proyectoActivoId = null, examenActivoId = null, imgPlantillaActiva = "";

    // ================= DASHBOARD Y NIVELES =================
    const NIVELES_SP = [
        { nivel: 1, nombre: "SP POBRE", xpMin: 0 }, { nivel: 2, nombre: "SP MEDIO", xpMin: 100 },
        { nivel: 3, nombre: "SEMI SP", xpMin: 300 }, { nivel: 4, nombre: "PRO SP", xpMin: 600 }, { nivel: 5, nombre: "SUPER SUPREMO", xpMin: 1000 }
    ];

    const frasesDelDia = [
        "La creatividad es la inteligencia divirtiéndose. - Albert Einstein",
        "El cine es verdad 24 veces por segundo. - Jean-Luc Godard",
        "No es lo que ves, es cómo lo ves. - Alfred Hitchcock",
        "El trabajo en equipo es la capacidad de trabajar juntos hacia una visión común. - Andrew Carnegie",
        "La mejor manera de predecir el futuro es crearlo. - Peter Drucker"
    ];

    function renderDashboard(usuarioActivo) {
        const diaDelAno = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const fraseHoy = frasesDelDia[diaDelAno % frasesDelDia.length];
        const quoteEl = document.getElementById('quoteText');
        if (quoteEl) quoteEl.textContent = fraseHoy;

        const perfil = directorioDB.find(p => p.nombre.trim().toLowerCase() === usuarioActivo.trim().toLowerCase());
        
        if (perfil) {
            const puntos = perfil.puntos || 0;
            let nivelActual = NIVELES_SP[0]; let nivelSiguiente = NIVELES_SP[1];
            for (let i = 0; i < NIVELES_SP.length; i++) { if (puntos >= NIVELES_SP[i].xpMin) { nivelActual = NIVELES_SP[i]; nivelSiguiente = NIVELES_SP[i + 1] || null; } }
            
            const dashNivel = document.getElementById('dashNivel'); 
            const dashXPText = document.getElementById('dashXPText'); 
            const dashXPBar = document.getElementById('dashXPBar');
            
            if (dashNivel) dashNivel.textContent = nivelActual.nombre;
            if (dashXPText) {
                if (nivelSiguiente) {
                    dashXPText.textContent = `${puntos} / ${nivelSiguiente.xpMin} XP`;
                    const progreso = ((puntos - nivelActual.xpMin) / (nivelSiguiente.xpMin - nivelActual.xpMin)) * 100;
                    if (dashXPBar) dashXPBar.style.width = `${progreso}%`;
                } else { 
                    dashXPText.textContent = `${puntos} XP (Nivel Máximo)`; 
                    if (dashXPBar) dashXPBar.style.width = `100%`; 
                }
            }
        }

        const misTareas = tareas.filter(t => t.asignado === usuarioActivo && t.estado !== 'completed').slice(0, 3);
        const listaTareas = document.getElementById('dashTareasList');
        if (listaTareas) {
            listaTareas.innerHTML = '';
            if (misTareas.length === 0) { listaTareas.innerHTML = '<li style="color: #666; font-size: 0.9rem;">¡Todo al día! No tienes tareas pendientes.</li>'; } 
            else {
                misTareas.forEach(t => {
                    const colorTag = t.estado === 'pending' ? '#ef4444' : '#f7c948'; const textoTag = t.estado === 'pending' ? 'Por Hacer' : 'En Proceso';
                    listaTareas.innerHTML += `<li class="dash-task-item" onclick="abrirModalTarea('${t.id}')" style="cursor: pointer;"><span>${t.titulo}</span><span class="tag" style="background: rgba(247, 201, 72, 0.1); color: ${colorTag}; border: 1px solid ${colorTag};">${textoTag}</span></li>`;
                });
            }
        }

        const dashAnuncio = document.getElementById('dashAnuncio');
        if (dashAnuncio) {
            if (anunciosDB.length > 0) {
                const ultimo = anunciosDB[0];
                dashAnuncio.innerHTML = `<h4 style="color: #f3f4f6; font-size: 0.95rem; margin-bottom: 5px;">${ultimo.titulo}</h4><p style="color: #9ca3af; font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${ultimo.mensaje}</p>`;
            } else { dashAnuncio.innerHTML = '<p style="color: #666; font-size: 0.85rem;">No hay anuncios recientes.</p>'; }
        }
    }

    // ================= BÓVEDA DE IDEAS =================
    db.collection("ideas").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        ideasDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (b.votos || 0) - (a.votos || 0));
        renderIdeas();
    });

    window.renderIdeas = function() {
        const grid = document.getElementById('gridIdeas'); if (!grid) return; grid.innerHTML = '';
        if (ideasDB.length === 0) { grid.innerHTML = '<p style="color:#666;">Aún no hay ideas. ¡Sé el primero en proponer una!</p>'; return; }
        
        ideasDB.forEach(idea => {
            const isImage = idea.imagen && idea.imagen.length > 0;
            const imgHTML = isImage ? `<img src="${idea.imagen}" class="moodboard-img">` : `<div class="moodboard-img" style="display:flex;align-items:center;justify-content:center;background:#1a1a24;font-size:3rem;">💡</div>`;
            const btnConvertir = esGerente ? `<button class="btn-usar-plantilla" style="margin-top:5px; background:#22c55e;" onclick="convertirIdeaATarea('${idea.id}')"><i class="fa-solid fa-check"></i> Convertir a Tarea</button>` : '';
            const btnEliminar = esGerente || idea.autor === nombreStaff ? `<button class="moodboard-delete" onclick="eliminarIdea('${idea.id}')"><i class="fa-solid fa-trash"></i></button>` : '';

            grid.innerHTML += `
                <div class="moodboard-card">
                    ${btnEliminar}
                    ${imgHTML}
                    <div class="moodboard-info">
                        <div class="moodboard-titulo">${idea.titulo}</div>
                        <div class="moodboard-autor" style="margin-bottom: 10px;">Por: ${idea.autor}</div>
                        <p style="color:#9ca3af; font-size:0.85rem; margin-bottom:15px;">${idea.descripcion}</p>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <button class="btn-primary" style="flex:1; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444;" onclick="votarIdea('${idea.id}', ${idea.votos || 0})">
                                <i class="fa-solid fa-heart"></i> ${idea.votos || 0} Votos
                            </button>
                        </div>
                        ${btnConvertir}
                    </div>
                </div>
            `;
        });
    }

    window.votarIdea = function(id, votosActuales) { db.collection("ideas").doc(id).update({ votos: votosActuales + 1 }); }
    window.eliminarIdea = function(id) { if (confirm("¿Eliminar esta idea?")) { db.collection("ideas").doc(id).delete(); } }

    window.convertirIdeaATarea = function(id) {
        const idea = ideasDB.find(i => i.id === id); if (!idea) return;
        document.getElementById('inputTarea').value = idea.titulo;
        document.getElementById('inputDescripcionTarea').value = idea.descripcion + " (Idea propuesta por: " + idea.autor + ")";
        document.getElementById('inputProyecto').value = "Idea";
        if (idea.imagen) { imgPlantillaActiva = idea.imagen; }
        document.getElementById('formNuevaTarea').style.display = 'flex';
        document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none'); document.getElementById('view-inicio').style.display = 'block';
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); document.querySelector('.nav-link[data-target="inicio"]').classList.add('active');
        alert("Idea cargada en el formulario. Asigna un responsable y una fecha para crearla.");
    }

    if(document.getElementById('btnGuardarIdea')) {
        document.getElementById('btnGuardarIdea').addEventListener('click', async () => {
            const titulo = document.getElementById('ideaTitulo').value; const descripcion = document.getElementById('ideaDesc').value; const fileInput = document.getElementById('ideaFoto'); const boton = document.getElementById('btnGuardarIdea');
            if (titulo && descripcion) {
                let imagenUrl = "";
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    boton.innerHTML = "Subiendo..."; boton.disabled = true;
                    try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { imagenUrl = data.secure_url; } } catch (error) { console.log(error); }
                    boton.innerHTML = "Publicar Idea"; boton.disabled = false;
                }
                db.collection("ideas").add({ titulo, descripcion, imagen: imagenUrl, autor: nombreStaff, votos: 0, timestamp: Date.now() }).then(() => {
                    document.getElementById('formNuevaIdea').style.display = 'none';
                    document.getElementById('ideaTitulo').value = ''; document.getElementById('ideaDesc').value = ''; fileInput.value = '';
                });
            } else { alert("El título y la descripción son obligatorios."); }
        });
    }

    // ================= ADMINISTRADOR DE NOTIFICACIONES =================
    window.cargarUsuariosNoti = function() {
        const select = document.getElementById('notiPara'); if (!select) return;
        select.innerHTML = '<option value="Todos">Todos los usuarios (Broadcast)</option>';
        directorioDB.forEach(p => { select.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`; });
    }

    if(document.getElementById('btnEnviarNoti')) {
        document.getElementById('btnEnviarNoti').addEventListener('click', () => {
            const para = document.getElementById('notiPara').value; const mensaje = document.getElementById('notiMensaje').value;
            if (mensaje) {
                if (para === "Todos") {
                    directorioDB.forEach(p => { crearNotificacion(p.nombre, `📢 ANUNCIO: ${mensaje}`); });
                    alert("Notificación enviada a todos.");
                } else {
                    crearNotificacion(para, `📢 Mensaje: ${mensaje}`);
                    alert(`Notificación enviada a ${para}.`);
                }
                document.getElementById('notiMensaje').value = '';
            } else { alert("Escribe un mensaje."); }
        });
    }

    // ================= SIMULADOR DE POST =================
    window.previewMockup = function(event) {
        const input = event.target;
        if (input.files && input.files[0]) { const reader = new FileReader(); reader.onload = function(e) { document.getElementById('mockupImg').src = e.target.result; }; reader.readAsDataURL(input.files[0]); }
    }
    window.actualizarCaption = function() { const text = document.getElementById('mockupCaption').value; document.getElementById('mockupCaptionText').textContent = text || "Escribe algo aquí..."; }

    // ================= CAJA MISTERIOSA =================
    window.verificarCaja = function() {
        const hoy = new Date().toDateString(); const ultimaApertura = localStorage.getItem('lootBox_' + nombreStaff);
        const status = document.getElementById('lootBoxStatus'); const icon = document.getElementById('lootBoxIcon');
        if (hoy === ultimaApertura) { if(status) status.textContent = "Vuelve mañana por otra recompensa."; if(icon) { icon.style.opacity = '0.5'; icon.style.cursor = 'not-allowed'; icon.onclick = null; } } 
        else { if(status) status.textContent = "¡Haz clic para abrir!"; if(icon) { icon.style.opacity = '1'; icon.style.cursor = 'pointer'; icon.onclick = window.abrirLootBox; } }
    }
    window.abrirLootBox = function() {
        const hoy = new Date().toDateString(); const recompensasPosibles = [10, 20, 30, 50, 100]; const puntosGanados = recompensasPosibles[Math.floor(Math.random() * recompensasPosibles.length)];
        localStorage.setItem('lootBox_' + nombreStaff, hoy); verificarCaja();
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 }, colors: ['#f7c948', '#3b82f6', '#ef4444', '#22c55e'] });
        darPuntos(nombreStaff, puntosGanados); mostrarToast(`🎁 ¡Felicidades! Has ganado ${puntosGanados} XP.`);
    };
    verificarCaja();

    // ================= RULETA DIARIA =================
    let girando = false;
    window.girarRuleta = function() {
        if (girando) return; const hoy = new Date().toDateString(); const ultimaTirada = localStorage.getItem('ruleta_' + nombreStaff);
        if (hoy === ultimaTirada) { mostrarToast("Ya giraste la ruleta hoy. Vuelve mañana."); return; }
        girando = true; const wheel = document.getElementById('wheel'); const grados = 1800 + Math.floor(Math.random() * 360);
        wheel.style.transform = `rotate(${grados}deg)`;
        setTimeout(() => {
            const premios = [10, 20, 50, 100, 5, 15, 30, 200]; const premio = premios[Math.floor(Math.random() * premios.length)];
            localStorage.setItem('ruleta_' + nombreStaff, hoy); document.getElementById('ruletaResultado').textContent = `¡Ganaste ${premio} XP! 🎉`;
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } }); darPuntos(nombreStaff, premio); girando = false;
        }, 3500);
    };

    // ================= RADAR, WIKI, BTS, PLANTILLAS, BÓVEDA =================
    db.collection("radar").onSnapshot((snapshot) => { radarDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.timestamp - a.timestamp); renderRadar(); });
    window.renderRadar = function() {
        const grid = document.getElementById('gridRadar'); if (!grid) return; grid.innerHTML = '';
        if (radarDB.length === 0) { grid.innerHTML = '<p style="color:#666;">Aún no hay tendencias guardadas.</p>'; return; }
        radarDB.forEach(r => {
            const botonEliminar = (esGerente || esMarketing) ? `<button class="moodboard-delete" onclick="eliminarRadar('${r.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            grid.innerHTML += `<div class="radar-card">${botonEliminar}<span class="radar-badge">${r.categoria || 'General'}</span><div class="radar-titulo">${r.titulo}</div><div class="radar-desc">${r.descripcion}</div><a href="${r.link}" target="_blank" class="btn-radar-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Tendencia</a></div>`;
        });
    };
    if(document.getElementById('btnGuardarRadar')) {
        document.getElementById('btnGuardarRadar').addEventListener('click', () => {
            const titulo = document.getElementById('radarTitulo').value; const categoria = document.getElementById('radarCategoria').value || 'General'; const link = document.getElementById('radarLink').value; const descripcion = document.getElementById('radarDesc').value;
            if (titulo && link) { db.collection("radar").add({ titulo, categoria, link, descripcion, autor: nombreStaff, timestamp: Date.now() }).then(() => { document.getElementById('formNuevoRadar').style.display = 'none'; document.getElementById('radarTitulo').value = ''; document.getElementById('radarCategoria').value = ''; document.getElementById('radarLink').value = ''; document.getElementById('radarDesc').value = ''; mostrarToast("¡Tendencia guardada!"); }); } 
            else { alert("El título y el link son obligatorios."); }
        });
    }
    window.eliminarRadar = function(id) { if (confirm("¿Eliminar esta tendencia?")) { db.collection("radar").doc(id).delete(); } };

    db.collection("wiki").onSnapshot((snapshot) => { wikiDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderWiki(); });
    window.renderWiki = function() {
        const grid = document.getElementById('gridWiki'); if (!grid) return; grid.innerHTML = '';
        if (wikiDB.length === 0) { grid.innerHTML = '<p style="color:#666;">No hay artículos en la Wiki aún.</p>'; return; }
        wikiDB.forEach(w => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarWiki('${w.id}')" style="padding: 2px 8px;"><i class="fa-solid fa-trash"></i></button>` : '';
            grid.innerHTML += `<div class="wiki-card"><h4>${w.titulo} ${botonEliminar}</h4><p>${w.contenido}</p></div>`;
        });
    };
    if(document.getElementById('btnGuardarWiki')) {
        document.getElementById('btnGuardarWiki').addEventListener('click', () => {
            const titulo = document.getElementById('wikiTitulo').value; const contenido = document.getElementById('wikiContenido').value;
            if (titulo && contenido) { db.collection("wiki").add({ titulo, contenido, timestamp: Date.now() }).then(() => { document.getElementById('formNuevaWiki').style.display = 'none'; document.getElementById('wikiTitulo').value = ''; document.getElementById('wikiContenido').value = ''; }); } 
            else { alert("Escribe un título y el contenido."); }
        });
    }
    window.eliminarWiki = function(id) { if (confirm("¿Eliminar este artículo?")) { db.collection("wiki").doc(id).delete(); } };

    const gridBTS = document.getElementById('gridBTS');
    db.collection("bts").orderBy("timestamp", "desc").onSnapshot((snapshot) => { btsDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderBTS(); });
    window.renderBTS = function() {
        if (!gridBTS) return; gridBTS.innerHTML = '';
        if (btsDB.length === 0) { gridBTS.innerHTML = '<p style="color:#666;">Aún no hay fotos. ¡Sube la primera!</p>'; return; }
        btsDB.forEach(img => {
            const botonEliminar = esGerente || img.autor === nombreStaff ? `<button class="moodboard-delete" onclick="eliminarBTS('${img.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            gridBTS.innerHTML += `<div class="moodboard-card">${botonEliminar}<img src="${img.url}" class="moodboard-img" alt="BTS"><div class="moodboard-info"><div class="moodboard-titulo">${img.titulo}</div><div class="moodboard-autor">Subido por: ${img.autor}</div></div></div>`;
        });
    }
    if(document.getElementById('btnGuardarBTS')) {
        document.getElementById('btnGuardarBTS').addEventListener('click', async () => {
            const titulo = document.getElementById('btsTitulo').value; const fileInput = document.getElementById('btsFoto'); const boton = document.getElementById('btnGuardarBTS');
            if (titulo && fileInput.files.length > 0) {
                const file = fileInput.files[0]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                boton.innerHTML = "Subiendo..."; boton.disabled = true;
                try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { db.collection("bts").add({ titulo, url: data.secure_url, autor: nombreStaff, timestamp: Date.now() }).then(() => { document.getElementById('formNuevoBTS').style.display = 'none'; document.getElementById('btsTitulo').value = ''; fileInput.value = ''; }); } } catch (error) { alert("Error al subir."); }
                boton.innerHTML = "Subir al Muro"; boton.disabled = false;
            } else { alert("Escribe un título y selecciona una foto."); }
        });
    }
    window.eliminarBTS = function(id) { if (confirm("¿Eliminar esta foto?")) { db.collection("bts").doc(id).delete(); } };

    db.collection("plantillas").onSnapshot((snapshot) => { plantillasDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderPlantillas(); });
    window.renderPlantillas = function() {
        const grid = document.getElementById('gridPlantillas'); if (!grid) return; grid.innerHTML = '';
        if (plantillasDB.length === 0) { grid.innerHTML = '<p style="color:#666;">No hay plantillas creadas.</p>'; return; }
        plantillasDB.forEach(p => {
            const botonEliminar = esGerente ? `<button class="moodboard-delete" onclick="eliminarPlantilla('${p.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            const imgHTML = p.imagen ? `<img src="${p.imagen}" class="plantilla-img">` : `<div class="plantilla-img" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📄</div>`;
            grid.innerHTML += `<div class="plantilla-card">${botonEliminar}${imgHTML}<div class="plantilla-info"><div class="plantilla-titulo">${p.titulo}</div><div class="plantilla-desc">${p.descripcion}</div><div class="xp-badge" style="align-self:flex-start; margin-bottom:10px;"><i class="fa-solid fa-bolt"></i> ${p.xp} XP</div><button class="btn-usar-plantilla" onclick="usarPlantilla('${p.id}')"><i class="fa-solid fa-wand-magic-sparkles"></i> Usar esta Plantilla</button></div></div>`;
        });
    };
    window.usarPlantilla = function(id) {
        const p = plantillasDB.find(x => x.id === id); if (!p) return;
        document.getElementById('formNuevaTarea').style.display = 'flex';
        document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none'); document.getElementById('view-inicio').style.display = 'block';
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); document.querySelector('.nav-link[data-target="inicio"]').classList.add('active');
        document.getElementById('inputTarea').value = p.titulo; document.getElementById('inputDescripcionTarea').value = p.descripcion; document.getElementById('inputXP').value = p.xp;
        imgPlantillaActiva = p.imagen || ""; document.getElementById('formNuevaTarea').scrollIntoView({ behavior: 'smooth' });
    };
    if(document.getElementById('btnGuardarPlantilla')) {
        document.getElementById('btnGuardarPlantilla').addEventListener('click', async () => {
            const titulo = document.getElementById('plantillaTitulo').value; const descripcion = document.getElementById('plantillaDesc').value; const xp = document.getElementById('plantillaXP').value || 10; const fileInput = document.getElementById('plantillaFoto'); const boton = document.getElementById('btnGuardarPlantilla');
            if (titulo && descripcion) {
                let imagenUrl = "";
                if (fileInput.files.length > 0) { const file = fileInput.files[0]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); boton.innerHTML = "Subiendo..."; boton.disabled = true; try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { imagenUrl = data.secure_url; } } catch (error) { console.log(error); } boton.innerHTML = "Guardar Plantilla"; boton.disabled = false; }
                db.collection("plantillas").add({ titulo, descripcion, xp, imagen: imagenUrl }).then(() => { document.getElementById('formNuevaPlantilla').style.display = 'none'; document.getElementById('plantillaTitulo').value = ''; document.getElementById('plantillaDesc').value = ''; fileInput.value = ''; alert("¡Plantilla creada!"); });
            } else { alert("El título y las instrucciones son obligatorios."); }
        });
    }
    window.eliminarPlantilla = function(id) { if (confirm("¿Eliminar esta plantilla?")) { db.collection("plantillas").doc(id).delete(); } };

    db.collection("boveda").onSnapshot((snapshot) => { bovedaDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderBoveda(); });
    window.renderBoveda = function() {
        const tbody = document.getElementById('tablaBoveda'); if (!tbody) return; tbody.innerHTML = '';
        if (bovedaDB.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #666;">No hay contraseñas guardadas.</td></tr>'; return; }
        bovedaDB.forEach(b => {
            tbody.innerHTML += `<tr style="border-bottom: 1px solid #2a2a3a;"><td style="padding: 15px; color: white; font-weight: bold;">${b.servicio}</td><td style="padding: 15px; color: #9ca3af;">${b.usuario}</td><td style="padding: 15px; color: #f7c948; font-family: monospace; font-size: 1.1rem;"><span id="pass-${b.id}" data-real="${b.password}">••••••••</span></td><td style="padding: 15px; color: #9ca3af; font-size: 0.85rem;">${b.nota || '-'}</td><td style="padding: 15px;"><button class="btn-ver-pass" onclick="togglePassword('${b.id}')"><i class="fa-solid fa-eye" id="icon-${b.id}"></i></button><button class="btn-eliminar" onclick="eliminarAcceso('${b.id}')" style="margin-left:10px; padding: 5px 10px;"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    };
    window.togglePassword = function(id) {
        const span = document.getElementById(`pass-${id}`); const icon = document.getElementById(`icon-${id}`);
        if (span.textContent === '••••••••') { span.textContent = span.getAttribute('data-real'); icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } 
        else { span.textContent = '••••••••'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    };
    if(document.getElementById('btnGuardarBoveda')) {
        document.getElementById('btnGuardarBoveda').addEventListener('click', () => {
            const servicio = document.getElementById('bovedaServicio').value; const usuario = document.getElementById('bovedaUsuario').value; const password = document.getElementById('bovedaPassword').value; const nota = document.getElementById('bovedaNota').value;
            if (servicio && usuario && password) { db.collection("boveda").add({ servicio, usuario, password, nota }).then(() => { document.getElementById('bovedaServicio').value = ''; document.getElementById('bovedaUsuario').value = ''; document.getElementById('bovedaPassword').value = ''; document.getElementById('bovedaNota').value = ''; alert("Acceso guardado."); }); } 
            else { alert("Servicio, usuario y contraseña son obligatorios."); }
        });
    }
    window.eliminarAcceso = function(id) { if (confirm("¿Eliminar este acceso?")) { db.collection("boveda").doc(id).delete(); } };

    // ================= TIENDA =================
    const recompensasPorDefecto = [{ titulo: "Café Gratis", costo: 50, icono: "☕" }, { titulo: "Home Office (1 día)", costo: 150, icono: "🏠" }, { titulo: "Tarjeta de Regalo", costo: 300, icono: "💳" }, { titulo: "Día Libre", costo: 600, icono: "🏖️" }, { titulo: "Jefe por un Día", costo: 1200, icono: "👑" }];
    db.collection("tienda").onSnapshot((snapshot) => { if (snapshot.empty) { recompensasPorDefecto.forEach(r => db.collection("tienda").add(r)); } else { tiendaDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTienda(); } });
    db.collection("canjes").onSnapshot((snapshot) => { canjesDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.timestamp - a.timestamp); renderAdminCanjes(); });
    window.renderTienda = function() {
        const grid = document.getElementById('gridTienda'); if (!grid) return; grid.innerHTML = '';
        const miPerfil = directorioDB.find(p => p.nombre === nombreStaff); const misPuntos = miPerfil ? (miPerfil.puntos || 0) : 0;
        const saldoEl = document.getElementById('saldoXP'); if (saldoEl) saldoEl.textContent = `${misPuntos} XP`;
        tiendaDB.forEach(r => {
            const puedePagar = misPuntos >= r.costo; const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarRecompensa('${r.id}')" style="position: absolute; top: 10px; right: 10px; padding: 5px 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
            grid.innerHTML += `<div class="recompensa-card">${botonEliminar}<div class="recompensa-icono">${r.icono}</div><div class="recompensa-titulo">${r.titulo}</div><div class="recompensa-costo">${r.costo} XP</div><button class="btn-canjear" onclick="canjearRecompensa('${r.id}', '${r.titulo}', ${r.costo})" ${!puedePagar ? 'disabled' : ''}>${puedePagar ? 'Canjear' : 'Faltan XP'}</button></div>`;
        });
    };
    if(document.getElementById('btnGuardarRecompensa')) { document.getElementById('btnGuardarRecompensa').addEventListener('click', () => { const titulo = document.getElementById('tiendaTitulo').value; const costo = parseInt(document.getElementById('tiendaCosto').value); const icono = document.getElementById('tiendaIcono').value || '🎁'; if (titulo && costo > 0) { db.collection("tienda").add({ titulo, costo, icono }).then(() => { document.getElementById('formNuevaRecompensa').style.display = 'none'; document.getElementById('tiendaTitulo').value = ''; document.getElementById('tiendaCosto').value = ''; document.getElementById('tiendaIcono').value = ''; alert("¡Recompensa añadida!"); }); } else { alert("Escribe un título y un costo mayor a 0."); } }); }
    window.eliminarRecompensa = function(id) { if (confirm("¿Eliminar esta recompensa de la tienda?")) { db.collection("tienda").doc(id).delete(); } };
    window.canjearRecompensa = function(id, titulo, costo) {
        const miPerfil = directorioDB.find(p => p.nombre === nombreStaff); if (!miPerfil || (miPerfil.puntos || 0) < costo) { alert("No tienes suficientes XP."); return; }
        if(confirm(`¿Canjear "${titulo}" por ${costo} XP?`)) {
            db.collection("directorio").doc(miPerfil.id).update({ puntos: (miPerfil.puntos || 0) - costo }).then(() => {
                db.collection("canjes").add({ empleado: nombreStaff, recompensa: titulo, costo: costo, estado: 'pendiente', timestamp: Date.now() }).then(() => {
                    crearNotificacion(nombreStaff, `Has canjeado: ${titulo}. Gerencia ha sido notificada. ✅`);
                    ["Johan Sebastian", "Brayan Alexander", "Ximena Reyes"].forEach(g => { crearNotificacion(g, `🚨 ${nombreStaff} ha canjeado: ${titulo} (-${costo} XP).`); });
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); alert("¡Canje exitoso! Gerencia ha sido notificada.");
                });
            });
        }
    };
    window.renderAdminCanjes = function() {
        const tbody = document.getElementById('tablaCanjes'); if (!tbody) return; tbody.innerHTML = '';
        if (canjesDB.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #666;">No hay canjes registrados aún.</td></tr>'; return; }
        canjesDB.forEach(c => {
            const esPendiente = c.estado === 'pendiente'; const badge = esPendiente ? '<span class="badge-estado badge-pendiente">Pendiente ⏳</span>' : '<span class="badge-estado badge-aprobado">Entregado ✅</span>';
            const botonAccion = esPendiente ? `<button class="btn-aprobar" onclick="marcarCanjeEntregado('${c.id}')"><i class="fa-solid fa-check"></i> Marcar Entregado</button>` : '';
            tbody.innerHTML += `<tr style="border-bottom: 1px solid #2a2a3a;"><td style="padding: 15px; color: white; font-weight: bold;">${c.empleado}</td><td style="padding: 15px; color: #9ca3af;">${c.recompensa}</td><td style="padding: 15px; color: #3b82f6; font-weight: bold;">-${c.costo} XP</td><td style="padding: 15px;">${badge}</td><td style="padding: 15px;">${botonAccion}</td></tr>`;
        });
    };
    window.marcarCanjeEntregado = function(id) { if (confirm("¿Marcar este premio como entregado?")) { db.collection("canjes").doc(id).update({ estado: 'entregado' }).then(() => { const canje = canjesDB.find(c => c.id === id); if(canje) crearNotificacion(canje.empleado, `¡Tu premio "${canje.recompensa}" ha sido entregado! 🎉`); }); } };

    // ================= PANEL DE GERENCIA Y ADMIN XP =================
    window.cargarEmpleadosAdminXP = function() {
        const select = document.getElementById('adminXPEmpleado'); if (!select) return;
        select.innerHTML = '<option value="">Selecciona un empleado...</option>';
        directorioDB.forEach(p => { select.innerHTML += `<option value="${p.id}">${p.nombre} (${p.puntos || 0} XP)</option>`; });
    }

    window.renderGerencia = function() {
        if (!document.getElementById('kpiTareasTotal')) return;
        const totalTareas = tareas.length; const completadas = tareas.filter(t => t.estado === 'completed').length; const pendientes = tareas.filter(t => t.estado !== 'completed');
        document.getElementById('kpiTareasTotal').textContent = totalTareas; document.getElementById('kpiTareasSub').textContent = `${completadas} Completadas`;
        document.getElementById('kpiProyectos').textContent = proyectosDB.length;
        let presupuestoTotal = 0, gastadoTotal = 0;
        proyectosDB.forEach(p => { presupuestoTotal += (p.presupuesto || 0); const gastosProyecto = p.gastos || []; gastadoTotal += gastosProyecto.reduce((sum, g) => sum + g.monto, 0); });
        document.getElementById('kpiPresupuesto').textContent = `$${presupuestoTotal.toLocaleString('es-CO')}`; document.getElementById('kpiGastadoSub').textContent = `$${gastadoTotal.toLocaleString('es-CO')} Gastados`;
        document.getElementById('kpiEquipo').textContent = directorioDB.length;
        let totalMedallas = 0; directorioDB.forEach(p => { totalMedallas += (p.logros ? p.logros.length : 0); }); document.getElementById('kpiEquipoSub').textContent = `${totalMedallas} Medallas entregadas`;
        const tbodyAlertas = document.getElementById('tablaAlertasGerencia'); tbodyAlertas.innerHTML = '';
        if (pendientes.length === 0) { tbodyAlertas.innerHTML = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #22c55e;"><i class="fa-solid fa-check-circle"></i> ¡Todo al día!</td></tr>'; } 
        else {
            const pendientesOrdenadas = [...pendientes].sort((a, b) => a.estado === 'pending' ? -1 : 1);
            pendientesOrdenadas.forEach(t => {
                const colorEstado = t.estado === 'pending' ? '#ef4444' : '#f7c948'; const textoEstado = t.estado === 'pending' ? 'Por Hacer' : 'En Proceso';
                tbodyAlertas.innerHTML += `<tr style="border-bottom: 1px solid #2a2a3a;"><td style="padding: 15px; color: white; font-weight: bold;">${t.titulo}</td><td style="padding: 15px; color: #9ca3af;">${t.asignado}</td><td style="padding: 15px; color: #9ca3af;">${t.proyecto}</td><td style="padding: 15px; font-weight: bold; color: ${colorEstado};">${textoEstado}</td></tr>`;
            });
        }
        const canvasTareas = document.getElementById('graficoTareas'); const canvasPresupuesto = document.getElementById('graficoPresupuesto');
        if (canvasTareas && canvasPresupuesto) {
            if (graficoTareasInstance) graficoTareasInstance.destroy();
            const nombres = directorioDB.map(p => p.nombre.split(' ')[0]); const tareasCompletadasPorPersona = directorioDB.map(p => tareas.filter(t => t.asignado === p.nombre && t.estado === 'completed').length);
            graficoTareasInstance = new Chart(canvasTareas, { type: 'bar', data: { labels: nombres, datasets: [{ label: 'Tareas Completadas', data: tareasCompletadasPorPersona, backgroundColor: '#f7c948', borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#2a2a3a' }, ticks: { color: '#9ca3af' } }, x: { grid: { display: false }, ticks: { color: '#9ca3af' } } } } });
            if (graficoPresupuestoInstance) graficoPresupuestoInstance.destroy();
            graficoPresupuestoInstance = new Chart(canvasPresupuesto, { type: 'doughnut', data: { labels: ['Gastado', 'Disponible'], datasets: [{ data: [gastadoTotal, (presupuestoTotal - gastadoTotal > 0 ? presupuestoTotal - gastadoTotal : 0)], backgroundColor: ['#ef4444', '#22c55e'], borderWidth: 0 }] }, options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } } } });
        }
        cargarEmpleadosAdminXP();
    };

    if(document.getElementById('btnAdminXP')) {
        document.getElementById('btnAdminXP').addEventListener('click', () => {
            const docId = document.getElementById('adminXPEmpleado').value;
            const cantidad = parseInt(document.getElementById('adminXPCantidad').value);

            if (docId && !isNaN(cantidad)) {
                const persona = directorioDB.find(p => p.id === docId);
                if (persona) {
                    const nuevosPuntos = (persona.puntos || 0) + cantidad;
                    db.collection("directorio").doc(docId).update({ puntos: nuevosPuntos }).then(() => {
                        alert(`Se han aplicado ${cantidad} XP a ${persona.nombre}. Total: ${nuevosPuntos} XP.`);
                        crearNotificacion(persona.nombre, `¡Has recibido ${cantidad} XP de parte de Gerencia! ⚡`);
                        document.getElementById('adminXPCantidad').value = '';
                        cargarEmpleadosAdminXP();
                    });
                }
            } else { alert("Selecciona un empleado y escribe una cantidad válida."); }
        });
    }

    // ================= PANEL RRHH =================
    window.renderRRHH = function() {
        const tbody = document.getElementById('tablaRRHH'); if (!tbody) return; tbody.innerHTML = '';
        directorioDB.forEach(persona => {
            const medallas = persona.logros ? persona.logros.length : 0; const puntos = persona.puntos || 0;
            const examenesPersona = resultadosDB.filter(r => r.alumno === persona.nombre); let promedio = 0;
            if (examenesPersona.length > 0) { const suma = examenesPersona.reduce((acc, curr) => acc + curr.porcentaje, 0); promedio = Math.round(suma / examenesPersona.length); }
            const colorPromedio = promedio >= 70 ? '#22c55e' : (promedio > 0 ? '#ef4444' : '#9ca3af');
            tbody.innerHTML += `<tr style="border-bottom: 1px solid #2a2a3a;"><td style="padding: 15px; color: white; font-weight: bold;">${persona.nombre}</td><td style="padding: 15px; color: #9ca3af;">${persona.rol}</td><td style="padding: 15px; font-weight: bold; color: #3b82f6;">${puntos} XP</td><td style="padding: 15px; font-size: 1.2rem;">${medallas} 🏅</td><td style="padding: 15px; font-weight: bold; color: ${colorPromedio};">${promedio}%</td></tr>`;
        });
    }

    // ================= MIS ENTREGAS =================
    window.renderEntregas = function() {
        const grid = document.getElementById('gridEntregas'); if (!grid) return; grid.innerHTML = '';
        let archivosSubidos = [];
        tareas.forEach(t => { 
            if (t.asignado === nombreStaff && t.archivos && t.archivos.length > 0) { 
                t.archivos.forEach(a => { archivosSubidos.push({ nombre: a.nombre, url: a.url, tarea: t.titulo, estado: a.estado || 'pendiente' }); }); 
            } 
        });
        if (archivosSubidos.length === 0) { grid.innerHTML = '<p style="color:#666;">Aún no has subido archivos a tus tareas.</p>'; return; }
        archivosSubidos.forEach(a => {
            const isImage = a.url.match(/\.(jpeg|jpg|gif|png)$/) != null; const preview = isImage ? `<img src="${a.url}" class="moodboard-img" style="height: 150px;">` : `<div class="moodboard-img" style="display:flex;align-items:center;justify-content:center;background:#1a1a24;font-size:3rem;height:150px;">📄</div>`;
            let badgeEstado = ''; if (a.estado === 'aprobado') badgeEstado = '<span class="badge-estado badge-aprobado">Aprobado ✅</span>'; else if (a.estado === 'rechazado') badgeEstado = '<span class="badge-estado badge-rechazado">Cambios ❌</span>'; else badgeEstado = '<span class="badge-estado badge-pendiente">Pendiente ⏳</span>';
            grid.innerHTML += `<div class="moodboard-card">${preview}<div class="moodboard-info"><div class="moodboard-titulo" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.nombre}</div><div class="moodboard-autor">De: ${a.tarea}</div><div style="margin-top: 8px;">${badgeEstado}</div><a href="${a.url}" target="_blank" class="btn-descargar" style="margin-top: 10px; width: 100%;">Ver / Descargar</a></div></div>`;
        });
    }

    // ================= MOODBOARD =================
    const gridMoodboard = document.getElementById('gridMoodboard');
    db.collection("moodboard").orderBy("timestamp", "desc").onSnapshot((snapshot) => { moodboardDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderMoodboard(); evaluarLogros(); });
    window.renderMoodboard = function() {
        if(!gridMoodboard) return; gridMoodboard.innerHTML = '';
        if (moodboardDB.length === 0) { gridMoodboard.innerHTML = '<p style="color:#666;">El muro está vacío.</p>'; return; }
        moodboardDB.forEach(img => {
            const botonEliminar = esGerente || img.autor === nombreStaff ? `<button class="moodboard-delete" onclick="eliminarMoodboard('${img.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            gridMoodboard.innerHTML += `<div class="moodboard-card">${botonEliminar}<img src="${img.url}" class="moodboard-img" alt="Referencia"><div class="moodboard-info"><div class="moodboard-titulo">${img.titulo}</div><div class="moodboard-autor">Subido por: ${img.autor}</div></div></div>`;
        });
    }
    if(document.getElementById('btnGuardarMoodboard')) {
        document.getElementById('btnGuardarMoodboard').addEventListener('click', async () => {
            const titulo = document.getElementById('moodboardTitulo').value; const fileInput = document.getElementById('moodboardFoto'); const boton = document.getElementById('btnGuardarMoodboard');
            if (titulo && fileInput.files.length > 0) {
                const file = fileInput.files[0]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                boton.innerHTML = "Subiendo..."; boton.disabled = true;
                try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { db.collection("moodboard").add({ titulo, url: data.secure_url, autor: nombreStaff, timestamp: Date.now() }).then(() => { document.getElementById('formNuevoMoodboard').style.display = 'none'; document.getElementById('moodboardTitulo').value = ''; fileInput.value = ''; }); } } catch (error) { alert("Error al subir."); }
                boton.innerHTML = "Guardar en el Muro"; boton.disabled = false;
            } else { alert("Escribe un título y selecciona una imagen."); }
        });
    }
    window.eliminarMoodboard = function(id) { if (confirm("¿Eliminar esta referencia?")) { db.collection("moodboard").doc(id).delete(); } };

    // ================= OBJETIVOS =================
    const listaObjetivos = document.getElementById('listaObjetivos'); let objetivosDB = [];
    db.collection("metas").onSnapshot((snapshot) => { objetivosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderObjetivos(); });
    window.renderObjetivos = function() {
        if(!listaObjetivos) return; listaObjetivos.innerHTML = '';
        if (objetivosDB.length === 0) { listaObjetivos.innerHTML = '<p style="color:#666;">No hay objetivos activos.</p>'; return; }
        objetivosDB.forEach(meta => {
            const porcentaje = Math.min(Math.round((meta.progreso / meta.metaTotal) * 100), 100); const estaCompleto = porcentaje >= 100;
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarObjetivo('${meta.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
            let botonAccion = estaCompleto ? `<button class="btn-aportar completado" disabled><i class="fa-solid fa-trophy"></i> ¡Meta Cumplida!</button>` : `<button class="btn-aportar" onclick="aportarProgreso('${meta.id}', ${meta.progreso}, ${meta.metaTotal})"><i class="fa-solid fa-hand-holding-heart"></i> ¡Aportar Avance +1!</button>`;
            listaObjetivos.innerHTML += `<div class="objetivo-card ${estaCompleto ? 'completado' : ''}"><div class="objetivo-titulo">${meta.titulo}${botonEliminar}</div><div class="objetivo-info"><span>Progreso del equipo</span><span class="objetivo-numero">${meta.progreso} / ${meta.metaTotal}</span></div><div class="barra-progreso-bg"><div class="barra-progreso-fill ${estaCompleto ? 'completado' : ''}" style="width: ${porcentaje}%;"></div></div>${botonAccion}</div>`;
        });
    }
    if(document.getElementById('btnGuardarObjetivo')) { document.getElementById('btnGuardarObjetivo').addEventListener('click', () => { const titulo = document.getElementById('objetivoTitulo').value; const metaTotal = parseInt(document.getElementById('objetivoMeta').value); if (titulo && metaTotal > 0) { db.collection("metas").add({ titulo, metaTotal, progreso: 0 }).then(() => { document.getElementById('formNuevoObjetivo').style.display = 'none'; document.getElementById('objetivoTitulo').value = ''; document.getElementById('objetivoMeta').value = ''; }); } else { alert("Escribe un título y una meta mayor a 0."); } }); }
    window.aportarProgreso = function(id, progresoActual, metaTotal) {
        const nuevoProgreso = progresoActual + 1;
        db.collection("metas").doc(id).update({ progreso: nuevoProgreso }).then(() => { if (nuevoProgreso >= metaTotal) { const duration = 3000; const end = Date.now() + duration; (function frame() { confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f7c948', '#ff9a3c', '#4CAF50'] }); confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f7c948', '#ff9a3c', '#4CAF50'] }); if (Date.now() < end) requestAnimationFrame(frame); }()); } });
    };
    window.eliminarObjetivo = function(id) { if (confirm("¿Eliminar este objetivo?")) { db.collection("metas").doc(id).delete(); } };

    // ================= DIRECTORIO Y HALL DE LA FAMA =================
    const gridDirectorio = document.getElementById('gridDirectorio');
    db.collection("directorio").onSnapshot((snapshot) => {
        directorioDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderDirectorio(); renderHallDeLaFama(); renderRRHH(); renderGerencia(); renderTienda(); renderDashboard(nombreStaff); verificarCumpleanos();
        cargarUsuariosNoti();
    });
    function verificarCumpleanos() {
        const hoy = new Date(); const mesHoy = hoy.getMonth() + 1; const diaHoy = hoy.getDate();
        directorioDB.forEach(persona => {
            if (persona.cumpleanos) {
                const [year, month, day] = persona.cumpleanos.split('-');
                if (parseInt(month) === mesHoy && parseInt(day) === diaHoy) {
                    const banner = document.getElementById('bannerCumpleanos');
                    if (banner) { document.getElementById('nombreCumple').textContent = persona.nombre; banner.style.display = 'block'; if (!window.confettiLanzado) { confetti({ particleCount: 300, spread: 120, origin: { y: 0.3 } }); window.confettiLanzado = true; } }
                }
            }
        });
    }
    window.renderDirectorio = function() {
        if(!gridDirectorio) return; gridDirectorio.innerHTML = '';
        directorioDB.forEach(persona => {
            const inicial = persona.nombre.charAt(0).toUpperCase();
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarMiembro('${persona.id}')" style="position: absolute; top: 15px; right: 15px;"><i class="fa-solid fa-trash"></i></button>` : '';
            let avatarHTML = persona.foto ? `<img src="${persona.foto}" class="miembro-avatar-img">` : `<div class="miembro-avatar">${inicial}</div>`;
            const puntos = persona.puntos || 0;
            let medallasHTML = '';
            if (persona.logros && persona.logros.length > 0) { medallasHTML = `<div class="logros-container">`; persona.logros.forEach(logroKey => { const info = DICCIONARIO_LOGROS[logroKey]; if (info) medallasHTML += `<span class="medalla" title="${info.desc}">${info.icono}</span>`; }); medallasHTML += `</div>`; }
            gridDirectorio.innerHTML += `<div class="miembro-card">${botonEliminar}${avatarHTML}<h3 class="miembro-nombre">${persona.nombre}</h3><span class="miembro-rol">${persona.rol}</span><div class="xp-badge"><i class="fa-solid fa-bolt"></i> ${puntos} XP</div>${medallasHTML}<div class="miembro-contacto"><span><i class="fa-solid fa-envelope"></i> ${persona.correo}</span><span><i class="fa-solid fa-phone"></i> ${persona.telefono}</span></div></div>`;
        });
    }
    window.renderHallDeLaFama = function() {
        const podiumDiv = document.getElementById('hallDeLaFamaContent'); if (!podiumDiv) return; podiumDiv.innerHTML = '';
        const top3 = [...directorioDB].sort((a, b) => (b.puntos || 0) - (a.puntos || 0)).slice(0, 3);
        if (top3.length === 0) { podiumDiv.innerHTML = '<p style="color:#666;">Aún no hay datos para mostrar el podio.</p>'; return; }
        const crearTarjeta = (persona, posicion) => {
            if (!persona) return `<div class="podium-card podium-${posicion}" style="opacity: 0.3; justify-content: center;"><p style="color:#666;">Sin datos</p></div>`;
            const clases = ['podium-1', 'podium-2', 'podium-3']; const corona = posicion === 1 ? '<div class="podium-crown">👑</div>' : ''; const inicial = persona.nombre.charAt(0).toUpperCase();
            return `<div class="podium-card ${clases[posicion-1]}">${corona}<div class="podium-avatar">${inicial}</div><div class="podium-info"><div class="podium-name">${persona.nombre.split(' ')[0]}</div><div class="podium-rol">${persona.rol}</div></div><div class="podium-xp">${persona.puntos || 0} XP</div></div>`;
        };
        podiumDiv.innerHTML = crearTarjeta(top3[1], 2) + crearTarjeta(top3[0], 1) + crearTarjeta(top3[2], 3);
    }
    if(document.getElementById('btnGuardarDirectorio')) {
        document.getElementById('btnGuardarDirectorio').addEventListener('click', async () => {
            const nombre = document.getElementById('dirNombre').value; const rol = document.getElementById('dirRol').value; const correo = document.getElementById('dirCorreo').value; const telefono = document.getElementById('dirTelefono').value; const cumpleanos = document.getElementById('dirCumpleanos').value; const fileInput = document.getElementById('dirFoto'); const boton = document.getElementById('btnGuardarDirectorio');
            if (nombre && rol) {
                let fotoUrl = "";
                if (fileInput.files.length > 0) { const file = fileInput.files[0]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); boton.innerHTML = "Subiendo..."; boton.disabled = true; try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { fotoUrl = data.secure_url; } } catch (error) { console.log(error); } boton.innerHTML = "Guardar Integrante"; boton.disabled = false; }
                db.collection("directorio").add({ nombre, rol, correo: correo || "Sin correo", telefono: telefono || "Sin teléfono", cumpleanos, foto: fotoUrl, logros: [], puntos: 0 }).then(() => { document.getElementById('formNuevoDirectorio').style.display = 'none'; document.getElementById('dirNombre').value = ''; document.getElementById('dirRol').value = ''; document.getElementById('dirCorreo').value = ''; document.getElementById('dirTelefono').value = ''; document.getElementById('dirCumpleanos').value = ''; fileInput.value = ''; });
            } else { alert("El nombre y el puesto son obligatorios."); }
        });
    }
    window.eliminarMiembro = function(id) { if (confirm("¿Eliminar a este integrante?")) { db.collection("directorio").doc(id).delete(); } };

    // ================= ANUNCIOS =================
    const listaAnuncios = document.getElementById('listaAnuncios');
    db.collection("anuncios").onSnapshot((snapshot) => { anunciosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderAnuncios(); renderDashboard(nombreStaff); });
    window.renderAnuncios = function() {
        if(!listaAnuncios) return; listaAnuncios.innerHTML = '';
        if (anunciosDB.length === 0) { listaAnuncios.innerHTML = '<p style="color:#666;">No hay comunicados publicados aún.</p>'; return; }
        const anunciosOrdenados = [...anunciosDB].sort((a, b) => { if (a.prioridad === 'Urgente' && b.prioridad !== 'Urgente') return -1; if (a.prioridad !== 'Urgente' && b.prioridad === 'Urgente') return 1; return b.timestamp - a.timestamp; });
        anunciosOrdenados.forEach(a => {
            const esUrgente = a.prioridad === 'Urgente'; const claseCard = esUrgente ? 'anuncio-urgente' : 'anuncio-normal'; const badge = esUrgente ? '<span class="badge-urgente">URGENTE 🚨</span>' : '';
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarAnuncio('${a.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
            listaAnuncios.innerHTML += `<div class="anuncio-card ${claseCard}"><div class="anuncio-header"><div>${badge}<h3 style="margin-top: 5px;">${a.titulo}</h3><span class="anuncio-fecha">Publicado por: ${a.autor} | ${a.fecha}</span></div>${botonEliminar}</div><div class="anuncio-mensaje">${a.mensaje}</div></div>`;
        });
    }
    if(document.getElementById('btnGuardarAnuncio')) {
        document.getElementById('btnGuardarAnuncio').addEventListener('click', () => {
            const titulo = document.getElementById('anuncioTitulo').value; const mensaje = document.getElementById('anuncioMensaje').value; const prioridad = document.getElementById('anuncioPrioridad').value;
            if (titulo && mensaje) { const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); db.collection("anuncios").add({ titulo, mensaje, prioridad, autor: nombreStaff, fecha: fechaActual, timestamp: Date.now() }).then(() => { document.getElementById('formNuevoAnuncio').style.display = 'none'; document.getElementById('anuncioTitulo').value = ''; document.getElementById('anuncioMensaje').value = ''; }); } else { alert("Escribe el título y el mensaje."); }
        });
    }
    window.eliminarAnuncio = function(id) { if (confirm("¿Eliminar este comunicado?")) { db.collection("anuncios").doc(id).delete(); } };

    // ================= EXÁMENES =================
    const listaExamenes = document.getElementById('listaExamenes'); const tablaResultados = document.getElementById('tablaResultados'); const contenedorPreguntas = document.getElementById('contenedorPreguntas');
    db.collection("examenes").onSnapshot((snapshot) => { examenesDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderExamenes(); });
    db.collection("resultados").onSnapshot((snapshot) => { resultadosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderExamenes(); evaluarLogros(); renderRRHH(); });
    function crearBloquePregunta() {
        if(!contenedorPreguntas) return; const bloque = document.createElement('div'); bloque.className = 'pregunta-bloque';
        bloque.innerHTML = `<input type="text" class="p-pregunta" placeholder="Escribe la pregunta..." style="width: 100%; margin-bottom: 10px;"><div style="display: flex; gap: 10px;"><input type="text" class="p-opA" placeholder="Opción A" style="flex:1;"><input type="text" class="p-opB" placeholder="Opción B" style="flex:1;"></div><select class="p-correcta" style="width: 100%; margin-top: 10px; padding: 10px; background: #05050f; color: white; border-radius: 8px; border: 1px solid #333;"><option value="A">Correcta: Opción A</option><option value="B">Correcta: Opción B</option></select>`;
        contenedorPreguntas.appendChild(bloque);
    }
    if (document.getElementById('contenedorPreguntas')) {
        crearBloquePregunta();
        document.getElementById('btnAgregarPregunta').addEventListener('click', crearBloquePregunta);
        document.getElementById('btnGuardarExamen').addEventListener('click', () => {
            const titulo = document.getElementById('examenTitulo').value; const bloques = document.querySelectorAll('.pregunta-bloque'); const preguntas = [];
            if (!titulo) { alert("El examen necesita un título."); return; }
            bloques.forEach(b => { const preg = b.querySelector('.p-pregunta').value; const opA = b.querySelector('.p-opA').value; const opB = b.querySelector('.p-opB').value; const corr = b.querySelector('.p-correcta').value; if (preg && opA && opB) { preguntas.push({ pregunta: preg, opcionA: opA, opcionB: opB, correcta: corr }); } });
            if (preguntas.length === 0) { alert("Debes llenar al menos una pregunta."); return; }
            db.collection("examenes").add({ titulo, preguntas }).then(() => { document.getElementById('examenTitulo').value = ''; contenedorPreguntas.innerHTML = ''; crearBloquePregunta(); document.getElementById('formNuevoExamen').style.display = 'none'; });
        });
    }
    window.renderExamenes = function() {
        if(!listaExamenes) return; listaExamenes.innerHTML = '';
        if(examenesDB.length === 0) { listaExamenes.innerHTML = '<p style="color:#666;">No hay exámenes publicados aún.</p>'; } 
        else {
            examenesDB.forEach((ex) => {
                const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarExamen('${ex.id}')" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
                listaExamenes.innerHTML += `<li class="examen-card"><div><h3>${ex.titulo}</h3><p style="color:#a0a0b8; font-size: 0.9rem; margin-top: 5px;">${ex.preguntas.length} preguntas</p></div><div>${botonEliminar}<button class="btn-primary" onclick="abrirExamenParaResponder('${ex.id}')" style="margin-left: 10px;">Responder</button></div></li>`;
            });
        }
        if (tablaResultados) {
            tablaResultados.innerHTML = '';
            if(resultadosDB.length === 0) { tablaResultados.innerHTML = '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #666;">Aún no hay resultados registrados.</td></tr>'; } 
            else {
                const resOrdenados = [...resultadosDB].sort((a,b) => b.timestamp - a.timestamp);
                resOrdenados.forEach(res => { const color = res.porcentaje >= 70 ? '#22c55e' : '#ef4444'; tablaResultados.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 15px; color: white;">${res.alumno}</td><td style="padding: 15px; color: #a0a0b8;">${res.tituloExamen}</td><td style="padding: 15px; font-weight: bold; color: ${color};">${res.porcentaje}% (${res.aciertos}/${res.total})</td></tr>`; });
            }
        }
    }
    window.eliminarExamen = function(id) { if (confirm("¿Eliminar este examen?")) { db.collection("examenes").doc(id).delete(); } };
    window.abrirExamenParaResponder = function(id) {
        const examen = examenesDB.find(ex => ex.id === id); if(!examen) return; examenActivoId = id;
        document.getElementById('mExamenTitulo').textContent = examen.titulo; const contenedor = document.getElementById('mExamenPreguntas'); contenedor.innerHTML = '';
        examen.preguntas.forEach((p, index) => { contenedor.innerHTML += `<div class="pregunta-bloque"><p style="margin-bottom: 10px; font-weight: bold;">${index + 1}. ${p.pregunta}</p><label class="opcion-examen"><input type="radio" name="resp_${index}" value="A"> ${p.opcionA}</label><label class="opcion-examen"><input type="radio" name="resp_${index}" value="B"> ${p.opcionB}</label></div>`; });
        document.getElementById('modalExamen').style.display = 'flex';
    }
    window.cerrarModalExamen = function() { document.getElementById('modalExamen').style.display = 'none'; }
    if (document.getElementById('btnCalificarExamen')) {
        document.getElementById('btnCalificarExamen').addEventListener('click', () => {
            const examen = examenesDB.find(ex => ex.id === examenActivoId); if(!examen) return;
            let aciertos = 0; let todasRespondidas = true;
            examen.preguntas.forEach((p, index) => { const seleccion = document.querySelector(`input[name="resp_${index}"]:checked`); if (!seleccion) { todasRespondidas = false; } else if (seleccion.value === p.correcta) { aciertos++; } });
            if (!todasRespondidas) { alert("Por favor, responde todas las preguntas."); return; }
            const total = examen.preguntas.length; const porcentaje = Math.round((aciertos / total) * 100);
            db.collection("resultados").add({ examenId: examen.id, tituloExamen: examen.titulo, alumno: nombreStaff, porcentaje: porcentaje, aciertos: aciertos, total: total, timestamp: Date.now() }).then(() => {
                cerrarModalExamen();
                if (porcentaje >= 70) { confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } }); alert(`¡Felicidades ${nombreStaff}! Has aprobado con un ${porcentaje}%. 🎉`); darPuntos(nombreStaff, 20); } 
                else { alert(`Obtuviste un ${porcentaje}%. Necesitas al menos 70% para aprobar. 😢`); }
            });
        });
    }

    // ================= PROYECTOS =================
    const listaProyectos = document.getElementById('listaProyectos'); 
    db.collection("proyectos").onSnapshot((snapshot) => { proyectosDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderProyectosLista(); renderGerencia(); });
    window.renderProyectosLista = function() {
        if(!listaProyectos) return; listaProyectos.innerHTML = '';
        proyectosDB.forEach(p => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProyecto('${p.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            listaProyectos.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="abrirModalProyecto('${p.nombre}')"><div><i class="fa-solid fa-folder" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${p.nombre}</strong></div>${botonEliminar}</li>`;
        });
    }
    if(document.getElementById('btnGuardarProyecto')) {
        document.getElementById('btnGuardarProyecto').addEventListener('click', () => {
            const nombre = document.getElementById('inputProyectoNom').value; const cliente = document.getElementById('inputClienteProyecto').value || "Sin cliente"; const presupuesto = parseFloat(document.getElementById('inputPresupuestoProyecto').value) || 0;
            if (nombre && !proyectosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) { db.collection("proyectos").add({ nombre, cliente, presupuesto, gastos: [] }).then(() => { document.getElementById('formNuevoProyecto').style.display = 'none'; document.getElementById('inputProyectoNom').value = ''; document.getElementById('inputPresupuestoProyecto').value = ''; }); } else { alert("El proyecto ya existe o el nombre está vacío."); }
        });
    }
    window.eliminarProyecto = function(id) { if (confirm("¿Eliminar este proyecto?")) { db.collection("proyectos").doc(id).delete(); } };
    window.abrirModalProyecto = function(nombreProyecto) {
        const p = proyectosDB.find(proy => proy.nombre === nombreProyecto); if (!p) return;
        proyectoActivoId = p.id; document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        const lista = document.getElementById('mProyectoTareas'); lista.innerHTML = '';
        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);
        if(tareasDelProyecto.length === 0) { lista.innerHTML = '<p style="color:#666; font-size: 0.9rem;">No hay tareas en este proyecto.</p>'; } 
        else { tareasDelProyecto.forEach(t => { lista.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer; background: rgba(247, 201, 72, 0.1); border-color: #f7c948;" onclick="cerrarModal(); abrirModalTarea('${t.id}')"><div><i class="fa-solid fa-folder-open" style="color:#f7c948;"></i><strong style="margin-left:10px; color:white;">${t.titulo}</strong></div><div style="display:flex; gap:10px; align-items: center;"><span>Para: ${t.asignado}</span><i class="fa-solid fa-chevron-right"></i></div></li>`; }); }
        const seccionGastos = document.getElementById('seccionGastos'); if (puedeVerGastos) { seccionGastos.style.display = 'block'; renderGastosProyecto(p); } else { seccionGastos.style.display = 'none'; }
        document.getElementById('modalProyecto').style.display = 'flex';
    }
    function renderGastosProyecto(proyecto) {
        const presupuesto = proyecto.presupuesto || 0; const gastos = proyecto.gastos || []; const totalGastado = gastos.reduce((sum, g) => sum + g.monto, 0); const saldo = presupuesto - totalGastado;
        document.getElementById('resumenGastos').innerHTML = `<div class="resumen-box"><span>Presupuesto</span><strong>$${presupuesto.toFixed(2)}</strong></div><div class="resumen-box"><span>Gastado</span><strong style="color:#ef4444">-$${totalGastado.toFixed(2)}</strong></div><div class="resumen-box"><span>Disponible</span><strong class="${saldo < 0 ? 'negativo' : 'positivo'}">$${saldo.toFixed(2)}</strong></div>`;
        let porcentaje = 0; if (presupuesto > 0) porcentaje = Math.min((totalGastado / presupuesto) * 100, 100);
        const barra = document.getElementById('barraGastos'); barra.style.width = `${porcentaje}%`; barra.style.background = porcentaje > 90 ? '#ef4444' : '#f7c948';
        const lista = document.getElementById('listaGastos'); lista.innerHTML = '';
        if (gastos.length === 0) { lista.innerHTML = '<p style="color:#666; font-size: 0.9rem;">No hay gastos registrados.</p>'; } 
        else { gastos.forEach((g, index) => { lista.innerHTML += `<li class="gasto-item"><span>${g.concepto}</span><div style="display:flex; align-items:center; gap:10px;"><span class="gasto-monto">-$${g.monto.toFixed(2)}</span><button class="gasto-eliminar" onclick="eliminarGasto(${index})"><i class="fa-solid fa-trash"></i></button></div></li>`; }); }
    }
    window.agregarGasto = function() {
        const concepto = document.getElementById('gastoConcepto').value; const monto = parseFloat(document.getElementById('gastoMonto').value);
        if (concepto && monto > 0) { const proyecto = proyectosDB.find(p => p.id === proyectoActivoId); let gastosActuales = proyecto.gastos || []; gastosActuales.push({ concepto, monto }); db.collection("proyectos").doc(proyectoActivoId).update({ gastos: gastosActuales }).then(() => { document.getElementById('gastoConcepto').value = ''; document.getElementById('gastoMonto').value = ''; proyecto.gastos = gastosActuales; renderGastosProyecto(proyecto); }); } else { alert("Escribe un concepto y un monto válido."); }
    }
    window.eliminarGasto = function(index) {
        if (confirm("¿Eliminar este gasto?")) { const proyecto = proyectosDB.find(p => p.id === proyectoActivoId); let gastosActuales = proyecto.gastos || []; gastosActuales.splice(index, 1); db.collection("proyectos").doc(proyectoActivoId).update({ gastos: gastosActuales }).then(() => { proyecto.gastos = gastosActuales; renderGastosProyecto(proyecto); }); }
    }

    // ================= TAREAS (KANBAN Y TIEMPO) =================
    db.collection("tareas").onSnapshot((snapshot) => { tareas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTareas(); evaluarLogros(); renderEntregas(); renderGerencia(); renderDashboard(nombreStaff); });
    window.renderTareas = function() {
        const colPending = document.getElementById('kanban-pending'); const colProgress = document.getElementById('kanban-progress'); const colCompleted = document.getElementById('kanban-completed');
        if(!colPending) return; colPending.innerHTML = ''; colProgress.innerHTML = ''; colCompleted.innerHTML = '';
        const filtroActivo = document.getElementById('checkFiltroMisTareas') && document.getElementById('checkFiltroMisTareas').checked; const esBeatriz = (nombreStaff === "Beatriz Ortiz" || nombreStaff === "Beatriz"); const verSoloMisTareas = esBeatriz || filtroActivo;
        tareas.forEach((t) => {
            if (verSoloMisTareas && t.asignado !== nombreStaff) return;
            const esAsignado = (nombreStaff.trim().toLowerCase() === t.asignado.trim().toLowerCase());
            const etiquetaNota = t.calificacion ? `<span class="nota-tag"><i class="fa-solid fa-star"></i> ${t.calificacion}/10</span>` : '';
            const etiquetaXP = t.xp ? `<span class="xp-badge"><i class="fa-solid fa-bolt"></i> ${t.xp} XP</span>` : '';
            let etiquetaTiempo = '';
            if (t.estado === 'completed' && t.fechaCreacion && t.fechaFin) {
                const diff = t.fechaFin - t.fechaCreacion; const dias = Math.floor(diff / (1000 * 60 * 60 * 24)); const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
                etiquetaTiempo = `<span class="badge-estado badge-aprobado" style="margin-left:0; display:inline-block; font-size:0.65rem;"><i class="fa-solid fa-clock"></i> ${dias}d ${horas}h</span>`;
            }

            let botonesAccion = '';
            if (t.estado === 'pending') { botonesAccion = `<button class="btn-start" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'progress')"><i class="fa-solid fa-play"></i> Empezar</button>`; } 
            else if (t.estado === 'progress') { const btnReabrir = `<button class="btn-back" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'pending')"><i class="fa-solid fa-rotate-left"></i> Pausar</button>`; const btnTerminar = (esAsignado || esGerente) ? `<button class="btn-finish" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'completed')"><i class="fa-solid fa-check"></i> Terminar</button>` : ''; botonesAccion = btnReabrir + btnTerminar; } 
            else if (t.estado === 'completed') { botonesAccion = `<button class="btn-back" onclick="event.stopPropagation(); cambiarEstadoTarea('${t.id}', 'progress')"><i class="fa-solid fa-rotate-left"></i> Reabrir</button>`; if (esGerente) { botonesAccion += `<button class="btn-back" onclick="event.stopPropagation(); eliminarTarea('${t.id}')" style="flex: 0.5;"><i class="fa-solid fa-trash"></i></button>`; } }
            
            const cardHTML = `<div class="kanban-card ${t.estado}" onclick="abrirModalTarea('${t.id}')"><h4>${t.titulo}</h4><p>Asignado a: <strong>${t.asignado}</strong> <br> Proyecto: ${t.proyecto}</p><div style="display:flex; gap: 8px; flex-wrap:wrap; margin-bottom: 10px;">${etiquetaNota}${etiquetaXP}${etiquetaTiempo}</div><div class="kanban-actions">${botonesAccion}</div></div>`;
            if (t.estado === 'pending') colPending.innerHTML += cardHTML; else if (t.estado === 'progress') colProgress.innerHTML += cardHTML; else if (t.estado === 'completed') colCompleted.innerHTML += cardHTML;
        });
    }
    if(document.getElementById('checkFiltroMisTareas')) { document.getElementById('checkFiltroMisTareas').addEventListener('change', renderTareas); }
    
    window.cambiarEstadoTarea = function(id, nuevoEstado) {
        const t = tareas.find(tarea => tarea.id === id);
        const updateData = { estado: nuevoEstado };
        if (nuevoEstado === 'completed') { updateData.fechaFin = Date.now(); }

        db.collection("tareas").doc(id).update(updateData).then(() => { 
            if (nuevoEstado === 'completed') { 
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); 
                if (t && t.xp) darPuntos(t.asignado, parseInt(t.xp)); 
            } 
        });
    };

    if(document.getElementById('btnGuardarTarea')) {
        document.getElementById('btnGuardarTarea').addEventListener('click', async () => {
            const titulo = document.getElementById('inputTarea').value; const asignado = document.getElementById('inputAsignado').value; const fecha = document.getElementById('inputFecha').value; const proyecto = document.getElementById('inputProyecto').value.trim() || "General"; const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones."; const xp = document.getElementById('inputXP').value || 10;
            if (titulo) {
                if (proyecto !== "General" && !proyectosDB.find(p => p.nombre.toLowerCase() === proyecto.toLowerCase())) { await db.collection("proyectos").add({ nombre: proyecto, cliente: "Sin cliente", presupuesto: 0, gastos: [] }); }
                let archivosAdjuntos = [];
                if (imgPlantillaActiva) { archivosAdjuntos.push({ nombre: "Referencia_Flyer.jpg", url: imgPlantillaActiva, estado: 'aprobado' }); imgPlantillaActiva = ""; }
                db.collection("tareas").add({ titulo, asignado, fecha, estado: 'pending', desc, proyecto, xp, archivos: archivosAdjuntos, calificacion: null, fechaCreacion: Date.now() }).then(() => {
                    crearNotificacion(asignado, `Nueva tarea asignada: ${titulo}`);
                    document.getElementById('formNuevaTarea').style.display = 'none'; document.getElementById('inputTarea').value = ''; document.getElementById('inputProyecto').value = '';
                });
            } else { alert("Escribe qué hay que hacer."); }
        });
    }
    window.eliminarTarea = function(id) { if (confirm("¿Eliminar tarea?")) { db.collection("tareas").doc(id).delete(); } };
    window.abrirModalTarea = function(id) {
        const t = tareas.find(tarea => tarea.id === id); if(!t) return; tareaActivaId = id;
        document.getElementById('mTareaTitulo').textContent = t.titulo; document.getElementById('mTareaAsignado').textContent = `Asignado a: ${t.asignado} | Fecha límite: ${t.fecha}`; document.getElementById('mTareaDesc').textContent = t.desc;
        
        const tiempoEl = document.getElementById('mTareaTiempo');
        if (t.estado === 'completed' && t.fechaCreacion && t.fechaFin) {
            const diff = t.fechaFin - t.fechaCreacion; const dias = Math.floor(diff / (1000 * 60 * 60 * 24)); const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
            tiempoEl.innerHTML = `<i class="fa-solid fa-clock"></i> Tiempo total: ${dias} días y ${horas} horas.`;
        } else if (t.fechaCreacion) {
            const diff = Date.now() - t.fechaCreacion; const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
            tiempoEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Lleva abierta: ${dias} días.`;
        } else { tiempoEl.innerHTML = ''; }

        const calificacionAdmin = document.getElementById('calificacionAdmin'); const calificacionStaff = document.getElementById('calificacionStaff'); const textoCalificacion = document.getElementById('textoCalificacion');
        if (esGerente) { calificacionAdmin.style.display = 'flex'; calificacionStaff.style.display = 'none'; document.getElementById('inputCalificacion').value = t.calificacion || ''; } 
        else { calificacionAdmin.style.display = 'none'; calificacionStaff.style.display = 'flex'; if (t.calificacion) { textoCalificacion.textContent = `${t.calificacion} / 10`; textoCalificacion.style.color = '#22c55e'; } else { textoCalificacion.textContent = 'Sin calificar aún'; textoCalificacion.style.color = '#9ca3af'; } }
        renderArchivosModal(t); document.getElementById('modalTarea').style.display = 'flex';
    }
    window.guardarCalificacion = function() {
        const nota = document.getElementById('inputCalificacion').value; const t = tareas.find(tarea => tarea.id === tareaActivaId);
        if (nota < 1 || nota > 10 || nota === '') { alert("Ingresa una nota del 1 al 10."); return; }
        db.collection("tareas").doc(tareaActivaId).update({ calificacion: nota }).then(() => { crearNotificacion(t.asignado, `Has recibido una calificación de ${nota}/10 en: ${t.titulo}`); alert("Calificación guardada."); cerrarModal(); });
    }
    function renderArchivosModal(tarea) {
        const lista = document.getElementById('mTareaArchivos'); if(!lista) return; lista.innerHTML = ''; const archivos = tarea.archivos || [];
        if(archivos.length === 0) { lista.innerHTML = '<p style="color:#666; font-size:0.85rem;">No hay archivos aún.</p>'; } 
        else {
            archivos.forEach((a, index) => {
                const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/'); let badgeEstado = ''; let botonesAprobacion = '';
                if (a.estado === 'aprobado') badgeEstado = '<span class="badge-estado badge-aprobado">Aprobado ✅</span>'; else if (a.estado === 'rechazado') badgeEstado = '<span class="badge-estado badge-rechazado">Cambios ❌</span>'; else badgeEstado = '<span class="badge-estado badge-pendiente">Pendiente ⏳</span>';
                if (esGerente && a.estado !== 'aprobado') { botonesAprobacion = `<div style="display: flex; gap: 5px; margin-top: 5px;"><button class="btn-aprobar" onclick="aprobarArchivo('${tarea.id}', ${index}, 'aprobado')"><i class="fa-solid fa-check"></i> Aprobar</button><button class="btn-rechazar" onclick="aprobarArchivo('${tarea.id}', ${index}, 'rechazado')"><i class="fa-solid fa-xmark"></i> Cambios</button></div>`; }
                lista.innerHTML += `<li class="archivo-item" style="display: flex; flex-direction: column; align-items: flex-start; width: 100%;"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><a href="${a.url}" target="_blank" style="color: #fff; text-decoration: none;"><i class="fa-solid fa-file" style="color: #f7c948;"></i> ${a.nombre}</a><a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a></div><div style="display:flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 5px;">${badgeEstado}${botonesAprobacion}</div></li>`;
            });
        }
    }
    window.aprobarArchivo = function(tareaId, indexArchivo, nuevoEstado) {
        const t = tareas.find(tarea => tarea.id === tareaId); if (!t) return; let archivosActuales = t.archivos || [];
        if (nuevoEstado === 'rechazado') { const motivo = prompt("¿Qué cambios debe hacer el diseñador?"); if (motivo === null) return; archivosActuales[indexArchivo].motivoRechazo = motivo; }
        archivosActuales[indexArchivo].estado = nuevoEstado;
        db.collection("tareas").doc(tareaId).update({ archivos: archivosActuales }).then(() => { crearNotificacion(t.asignado, `Tu archivo en "${t.titulo}" ha sido marcado como: ${nuevoEstado.toUpperCase()}`); alert(`Archivo marcado como ${nuevoEstado}.`); renderArchivosModal(t); });
    };
    window.subirArchivosTarea = async function(event) {
        if (event) event.preventDefault(); const t = tareas.find(tarea => tarea.id === tareaActivaId); const input = document.getElementById('inputArchivoTarea'); if(input.files.length === 0) return;
        const boton = document.querySelector('.upload-area button'); const textOrig = boton.innerHTML; boton.innerHTML = "Subiendo..."; boton.disabled = true; let nuevosArchivos = t.archivos || [];
        for(let i=0; i<input.files.length; i++) { const file = input.files[i]; const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); try { const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData }); const data = await response.json(); if (data.secure_url) { nuevosArchivos.push({ nombre: file.name, url: data.secure_url, estado: 'pendiente' }); } } catch (error) { console.log(error); } }
        db.collection("tareas").doc(tareaActivaId).update({ archivos: nuevosArchivos }).then(() => { boton.innerHTML = textOrig; boton.disabled = false; input.value = ''; t.archivos = nuevosArchivos; renderArchivosModal(t); renderEntregas(); });
    }
    window.cerrarModal = function() { document.getElementById('modalTarea').style.display = 'none'; document.getElementById('modalProyecto').style.display = 'none'; }

    // ================= CALENDARIO =================
    let fechaCalendario = new Date();
    db.collection("eventos").onSnapshot((snapshot) => { eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderCalendario(); renderListaEventos(); });
    window.renderCalendario = function() {
        const grid = document.getElementById('calendarDays'); const display = document.getElementById('monthYearDisplay'); if(!grid) return; grid.innerHTML = '';
        const year = fechaCalendario.getFullYear(); const month = fechaCalendario.getMonth(); const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        display.textContent = `${meses[month]} ${year}`; const primerDia = new Date(year, month, 1).getDay(); const diasEnMes = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < primerDia; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`;
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`; const tieneEvento = eventos.some(e => e.fecha === fechaStr); const tieneTarea = tareas.some(t => t.fecha === fechaStr);
            let dotsHTML = ''; if (tieneEvento) dotsHTML += '<div class="event-dot" title="Evento"></div>'; if (tieneTarea) dotsHTML += '<div class="task-dot" title="Tarea Pendiente"></div>';
            grid.innerHTML += `<div class="calendar-day"><span class="day-number">${dia}</span>${dotsHTML}</div>`;
        }
    }
    if(document.getElementById('prevMonth')) { document.getElementById('prevMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() - 1); renderCalendario(); }); document.getElementById('nextMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() + 1); renderCalendario(); }); }
    function renderListaEventos() {
        const listaEventos = document.getElementById('listaEventos'); if(!listaEventos) return; listaEventos.innerHTML = '';
        let combinado = []; eventos.forEach(e => combinado.push({ tipo: 'evento', nombre: e.nombre, fecha: e.fecha })); tareas.forEach(t => { if(t.fecha) combinado.push({ tipo: 'tarea', nombre: t.titulo, fecha: t.fecha, estado: t.estado }); });
        combinado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        if(combinado.length === 0) { listaEventos.innerHTML = '<p style="color:#666;">No hay eventos ni tareas programadas.</p>'; return; }
        combinado.forEach(c => {
            const fechaFormat = new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (c.tipo === 'evento') { listaEventos.innerHTML += `<li class="archivo-item"><i class="fa-solid fa-calendar-check" style="color:#ef4444;"></i><div style="margin-left:10px;"><strong style="color:white; display:block;">${c.nombre}</strong><span style="font-size:0.85rem; color:#9ca3af; text-transform: capitalize;">${fechaFormat} (Evento)</span></div></li>`; } 
            else { const colorIcon = c.estado === 'completed' ? '#22c55e' : '#3b82f6'; listaEventos.innerHTML += `<li class="archivo-item" style="border-left: 3px solid ${colorIcon};"><i class="fa-solid fa-list-check" style="color:${colorIcon};"></i><div style="margin-left:10px;"><strong style="color:white; display:block;">Tarea: ${c.nombre}</strong><span style="font-size:0.85rem; color:#9ca3af; text-transform: capitalize;">${fechaFormat} (Entrega)</span></div></li>`; }
        });
    }
    if(document.getElementById('btnAgendarEvento')) { document.getElementById('btnAgendarEvento').addEventListener('click', () => { const nombre = document.getElementById('inputEvento').value; const fecha = document.getElementById('inputFechaEvento').value; if (nombre && fecha) { db.collection("eventos").add({ nombre, fecha }).then(() => { document.getElementById('inputEvento').value = ''; }); } else { alert("Escribe el nombre y la fecha."); } }); }

    // ================= NAVEGACIÓN =================
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
            this.classList.add('active'); const target = this.getAttribute('data-target'); document.getElementById('view-' + target).style.display = 'block';
            if (target === 'calendario') renderCalendario(); if (target === 'examenes') renderExamenes(); if (target === 'anuncios') renderAnuncios(); if (target === 'directorio') renderDirectorio(); if (target === 'hall') renderHallDeLaFama(); if (target === 'objetivos') renderObjetivos(); if (target === 'moodboard') renderMoodboard(); if (target === 'rrhh') renderRRHH(); if (target === 'entregas') renderEntregas(); if (target === 'gerencia') { renderGerencia(); cargarEmpleadosAdminXP(); } if (target === 'tienda') { renderTienda(); renderAdminCanjes(); } if (target === 'plantillas') { renderPlantillas(); } if (target === 'boveda') { renderBoveda(); } if (target === 'wiki') { renderWiki(); } if (target === 'bts') { renderBTS(); } if (target === 'radar') { renderRadar(); } if (target === 'caja') { verificarCaja(); } if (target === 'ruleta') { document.getElementById('ruletaResultado').textContent = ''; } if (target === 'inicio') { renderDashboard(nombreStaff); } if (target === 'admin-noti') { cargarUsuariosNoti(); } if (target === 'ideas') { renderIdeas(); }
        });
    });

    // ================= LÓGICA DEL MENÚ MÓVIL =================
    const btnMobileMenu = document.getElementById('btnMobileMenu'); const sidebar = document.querySelector('.sidebar'); const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (btnMobileMenu && sidebar && sidebarOverlay) {
        btnMobileMenu.addEventListener('click', () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('active'); });
        sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); });
        document.querySelectorAll('.nav-link').forEach(link => { link.addEventListener('click', () => { if (window.innerWidth <= 900) { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); } }); });
    }

    document.getElementById('btnLogout').addEventListener('click', function(e) { e.preventDefault(); localStorage.removeItem('staffLogueado'); window.location.href = "login"; });
});