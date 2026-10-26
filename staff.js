document.addEventListener('DOMContentLoaded', function() {
    
    if (localStorage.getItem('staffLogueado') !== 'true') { window.location.href = "login"; return; }
    
    const nombreStaff = localStorage.getItem('nombreStaff');
    const rolStaff = localStorage.getItem('rolStaff');
    document.getElementById('nombreStaff').textContent = nombreStaff;
    document.getElementById('avatarLetra').textContent = nombreStaff.charAt(0).toUpperCase();
    document.getElementById('rolStaff').textContent = rolStaff;

    const esGerente = (rolStaff === "Gerente General" || rolStaff === "Gerente de Marketing");
    const esFinanzas = (rolStaff === "Jefe de Finanzas" || rolStaff === "Jefa de Finanzas" || nombreStaff === "Jair");
    const puedeVerGastos = esGerente || esFinanzas;
    const esMarketing = (rolStaff === "Gerente de Marketing");
    const esRRHH = (nombreStaff === "Ximena" || rolStaff.includes("Recursos Humanos"));
    const esDisenadora = (nombreStaff === "Maria Fernanda" || rolStaff.includes("Diseñadora"));

    if (esGerente || esRRHH) document.getElementById('link-rrhh').style.display = 'flex';
    if (esGerente || esDisenadora) document.getElementById('link-entregas').style.display = 'flex';
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

    if (nombreStaff === "Beatriz" || esGerente) { document.getElementById('filtroContainer').style.display = 'block'; }

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

    db.collection("notificaciones").where("para", "==", nombreStaff).onSnapshot((snapshot) => {
        const cambios = snapshot.docChanges();
        notificaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.timestamp - a.timestamp);
        renderNotificaciones();
        cambios.forEach((cambio) => {
            if (cambio.type === "added") {
                const nuevaNoti = cambio.doc.data();
                if (!nuevaNoti.leida && (Date.now() - nuevaNoti.timestamp < 10000)) { mostrarToast(nuevaNoti.mensaje); playNotificationSound(); }
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
        'El Incansable': { icono: '🥇', desc: 'Completar 10 tareas' }, 'El Creativo': { icono: '🎬', desc: 'Subir archivos a 5 tareas' },
        'El Cerebrito': { icono: '🧠', desc: 'Sacar 100% en un examen' }, 'El Inspirador': { icono: '🖼️', desc: 'Subir 5 imágenes al Moodboard' }
    };
    function darPuntos(usuario, cantidad) {
        db.collection("directorio").where("nombre", "==", usuario).get().then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id; const data = querySnapshot.docs[0].data(); let puntosActuales = data.puntos || 0;
                db.collection("directorio").doc(docId).update({ puntos: puntosActuales + cantidad }).then(() => { 
                    crearNotificacion(usuario, `¡Has ganado +${cantidad} XP! Sigue así. ⚡`); 
                    renderDashboard(usuario); // Actualizar Dashboard
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
    let tiendaDB = [], canjesDB = [], plantillasDB = [], bovedaDB = [], btsDB = [], wikiDB = [], radarDB = [];
    let graficoTareasInstance = null, graficoPresupuestoInstance = null;
    let tareaActivaId = null, proyectoActivoId = null, examenActivoId = null, imgPlantillaActiva = "";

    // ================= DASHBOARD (NUEVO) =================
    const frasesDelDia = [
        "La creatividad es la inteligencia divirtiéndose. - Albert Einstein",
        "El cine es verdad 24 veces por segundo. - Jean-Luc Godard",
        "No es lo que ves, es cómo lo ves. - Alfred Hitchcock",
        "El trabajo en equipo es la capacidad de trabajar juntos hacia una visión común. - Andrew Carnegie",
        "La mejor manera de predecir el futuro es crearlo. - Peter Drucker"
    ];

    function renderDashboard(usuarioActivo) {
        // 1. Frase del día
        const diaDelAno = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const fraseHoy = frasesDelDia[diaDelAno % frasesDelDia.length];
        const quoteEl = document.getElementById('quoteText');
        if (quoteEl) quoteEl.textContent = fraseHoy;

        // 2. Mi Nivel
        const perfil = directorioDB.find(p => p.nombre === usuarioActivo);
        if (perfil) {
            const puntos = perfil.puntos || 0;
            const nivel = Math.floor(puntos / 100) + 1;
            const xpEnNivel = puntos % 100;
            const progreso = xpEnNivel; // 0 a 99

            const dashNivel = document.getElementById('dashNivel');
            const dashXPText = document.getElementById('dashXPText');
            const dashXPBar = document.getElementById('dashXPBar');

            if (dashNivel) dashNivel.textContent = `Nivel ${nivel}`;
            if (dashXPText) dashXPText.textContent = `${puntos} / ${nivel * 100} XP`;
            if (dashXPBar) dashXPBar.style.width = `${progreso}%`;
        }

        // 3. Mis Próximas Tareas
        const misTareas = tareas.filter(t => t.asignado === usuarioActivo && t.estado !== 'completed').slice(0, 3);
        const listaTareas = document.getElementById('dashTareasList');
        if (listaTareas) {
            listaTareas.innerHTML = '';
            if (misTareas.length === 0) {
                listaTareas.innerHTML = '<li style="color: #666; font-size: 0.9rem;">¡Todo al día! No tienes tareas pendientes.</li>';
            } else {
                misTareas.forEach(t => {
                    const colorTag = t.estado === 'pending' ? '#ef4444' : '#f7c948';
                    const textoTag = t.estado === 'pending' ? 'Por Hacer' : 'En Proceso';
                    listaTareas.innerHTML += `
                        <li class="dash-task-item" onclick="abrirModalTarea('${t.id}')" style="cursor: pointer;">
                            <span>${t.titulo}</span>
                            <span class="tag" style="background: rgba(247, 201, 72, 0.1); color: ${colorTag}; border: 1px solid ${colorTag};">${textoTag}</span>
                        </li>
                    `;
                });
            }
        }

        // 4. Último Anuncio
        const dashAnuncio = document.getElementById('dashAnuncio');
        if (dashAnuncio) {
            if (anunciosDB.length > 0) {
                const ultimo = anunciosDB[0];
                dashAnuncio.innerHTML = `
                    <h4 style="color: #f3f4f6; font-size: 1rem; margin-bottom: 5px;">${ultimo.titulo}</h4>
                    <p style="color: #9ca3af; font-size: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${ultimo.mensaje}</p>
                `;
            } else {
                dashAnuncio.innerHTML = '<p style="color: #666; font-size: 0.9rem;">No hay anuncios recientes.</p>';
            }
        }
    }

    // ================= SIMULADOR DE POST (MOCKUP) =================
    window.previewMockup = function(event) {
        const input = event.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) { document.getElementById('mockupImg').src = e.target.result; }
            reader.readAsDataURL(input.files[0]);
        }
    }
    window.actualizarCaption = function() {
        const text = document.getElementById('mockupCaption').value;
        document.getElementById('mockupCaptionText').textContent = text || "Escribe algo aquí...";
    }

    // ================= CAJA MISTERIOSA =================
    window.verificarCaja = function() {
        const hoy = new Date().toDateString(); const ultimaApertura = localStorage.getItem('lootBox_' + nombreStaff);
        const status = document.getElementById('lootBoxStatus'); const icon = document.getElementById('lootBoxIcon');
        if (hoy === ultimaApertura) {
            if(status) status.textContent = "Vuelve mañana por otra recompensa.";
            if(icon) { icon.style.opacity = '0.5'; icon.style.cursor = 'not-allowed'; icon.onclick = null; }
        } else {
            if(status) status.textContent = "¡Haz clic para abrir!";
            if(icon) { icon.style.opacity = '1'; icon.style.cursor = 'pointer'; icon.onclick = window.abrirLootBox; }
        }
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

    // ================= RADAR =================
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

    // ================= WIKI =================
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

    // ================= BTS =================
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

    // ================= PLANTILLAS =================
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

    // ================= BÓVEDA =================
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
    const recompensasPorDefecto = [{ titulo: "Café Gratis", costo: 50, icono: "☕" }, { titulo: "Home Office (1 día)",