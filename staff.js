document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('staffLogueado') !== 'true') { window.location.href = "login"; return; }
    
    const nombreStaff = localStorage.getItem('nombreStaff');
    const rolStaff = localStorage.getItem('rolStaff');
    document.getElementById('nombreStaff').textContent = nombreStaff;
    document.getElementById('avatarLetra').textContent = nombreStaff.charAt(0).toUpperCase();
    document.getElementById('rolStaff').textContent = rolStaff;

    const esGerente = (rolStaff === "Gerente General" || rolStaff === "Gerente de Marketing");
    if (esGerente) {
        document.getElementById('btnMostrarFormTarea').style.display = 'flex';
        document.getElementById('btnMostrarFormProyecto').style.display = 'flex';
        document.getElementById('btnMostrarFormCliente').style.display = 'flex';
    }

    const CLOUDINARY_CLOUD_NAME = "jc1rzsyt"; 
    const CLOUDINARY_UPLOAD_PRESET = "spotlight_uploads"; 

    // ================= SISTEMA DE NOTIFICACIONES =================
    let notificaciones = JSON.parse(localStorage.getItem('notificacionesSpotlight')) || [];
    const btnNotificaciones = document.getElementById('btnNotificaciones');
    const panelNotificaciones = document.getElementById('panelNotificaciones');
    const listaNotificaciones = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('badgeNotificaciones');

    function renderNotificaciones() {
        const misNotificaciones = notificaciones.filter(n => n.para === nombreStaff);
        const noLeidas = misNotificaciones.filter(n => !n.leida).length;
        
        if (noLeidas > 0) {
            badge.textContent = noLeidas;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        listaNotificaciones.innerHTML = '';
        if (misNotificaciones.length === 0) {
            listaNotificaciones.innerHTML = '<li>No tienes notificaciones nuevas.</li>';
        } else {
            misNotificaciones.forEach(n => {
                listaNotificaciones.innerHTML += `<li style="${!n.leida ? 'color: #fff; font-weight: bold;' : ''}">${n.mensaje}</li>`;
            });
        }
    }
    renderNotificaciones();

    btnNotificaciones.addEventListener('click', () => {
        panelNotificaciones.style.display = panelNotificaciones.style.display === 'block' ? 'none' : 'block';
        // Marcar como leídas
        notificaciones.forEach(n => { if(n.para === nombreStaff) n.leida = true; });
        localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
        renderNotificaciones();
    });

    // ================= PROYECTOS =================
    let proyectosDB = JSON.parse(localStorage.getItem('proyectosSpotlight')) || [{ id: 1, nombre: "Cortometraje Búho de Oro", cliente: "Interno" }];
    
    window.renderProyectosLista = function() {
        const listaProyectos = document.getElementById('listaProyectos');
        listaProyectos.innerHTML = '';
        proyectosDB.forEach(p => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProyecto(${p.id})"><i class="fa-solid fa-trash"></i></button>` : '';
            listaProyectos.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="abrirModalProyecto('${p.nombre}')"><div><i class="fa-solid fa-folder" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${p.nombre}</strong></div>${botonEliminar}</li>`;
        });
    }
    renderProyectosLista();

    document.getElementById('btnMostrarFormProyecto').addEventListener('click', () => { document.getElementById('formNuevoProyecto').style.display = document.getElementById('formNuevoProyecto').style.display === 'none' ? 'flex' : 'none'; });
    document.getElementById('btnGuardarProyecto').addEventListener('click', () => {
        const nombre = document.getElementById('inputProyectoNom').value;
        const cliente = document.getElementById('inputClienteProyecto').value || "Sin cliente";
        if (nombre) {
            if (!proyectosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                proyectosDB.push({ id: Date.now(), nombre, cliente });
                localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
                renderProyectosLista();
                document.getElementById('formNuevoProyecto').style.display = 'none';
                document.getElementById('inputProyectoNom').value = '';
            }
        }
    });
    window.eliminarProyecto = function(id) {
        if (confirm("¿Eliminar este proyecto?")) {
            proyectosDB = proyectosDB.filter(p => p.id !== id);
            localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
            renderProyectosLista();
        }
    };

    // ================= TAREAS =================
    let tareas = JSON.parse(localStorage.getItem('tareasSpotlight')) || [{ id: 1, titulo: "Edición de video - Panasonic", asignado: "Beatriz", fecha: "2026-10-21", estado: "progress", desc: "Cortar el clip de 0:15 a 0:45", proyecto: "General", archivos: [] }];
    let tareaActivaIndex = -1;

    function renderTareas() {
        const listaTareas = document.getElementById('listaTareas');
        const listaTareasCompletadas = document.getElementById('listaTareasCompletadas');
        listaTareas.innerHTML = ''; listaTareasCompletadas.innerHTML = '';
        tareas.forEach((t, index) => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarTarea(${index})"><i class="fa-solid fa-trash"></i></button>` : '';
            const esAsignado = (nombreStaff.trim().toLowerCase() === t.asignado.trim().toLowerCase());
            const botonCompletar = (t.estado !== 'completed' && esAsignado) ? `<button class="btn-completar" onclick="event.stopPropagation(); completarTarea(${index})"><i class="fa-solid fa-check"></i></button>` : '';

            const html = `<div class="task-item" style="justify-content: space-between; ${t.estado === 'completed' ? 'opacity: 0.6;' : ''}" onclick="abrirModalTarea(${index})"><div style="display: flex; align-items: center; gap: 20px;"><div class="task-status ${t.estado}"></div><div class="task-details"><h4>${t.titulo}</h4><p>Para: ${t.asignado} | Proyecto: ${t.proyecto}</p></div></div><div style="display: flex; align-items: center; gap: 10px;"><span class="task-tag">${t.estado}</span>${botonCompletar}${botonEliminar}</div></div>`;
            if (t.estado === 'completed') { listaTareasCompletadas.innerHTML += html; } else { listaTareas.innerHTML += html; }
        });
    }
    renderTareas();

    document.getElementById('btnMostrarFormTarea').addEventListener('click', () => { document.getElementById('formNuevaTarea').style.display = document.getElementById('formNuevaTarea').style.display === 'none' ? 'flex' : 'none'; });
    document.getElementById('btnGuardarTarea').addEventListener('click', () => {
        const titulo = document.getElementById('inputTarea').value;
        const asignado = document.getElementById('inputAsignado').value;
        const fecha = document.getElementById('inputFecha').value;
        const proyecto = document.getElementById('inputProyecto').value.trim() || "General";
        const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones.";
        
        if (titulo) {
            // Crear carpeta si no existe
            if (proyecto !== "General" && !proyectosDB.find(p => p.nombre.toLowerCase() === proyecto.toLowerCase())) {
                proyectosDB.push({ id: Date.now(), nombre: proyecto, cliente: "Sin cliente" });
                localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
                renderProyectosLista();
            }
            
            // Guardar tarea
            tareas.unshift({ id: Date.now(), titulo, asignado, fecha, estado: 'pending', desc, proyecto, archivos: [] });
            localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
            
            // CREAR NOTIFICACIÓN PARA EL ASIGNADO
            notificaciones.push({ id: Date.now(), para: asignado, mensaje: `Nueva tarea asignada: ${titulo}`, leida: false });
            localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
            renderNotificaciones();

            renderTareas(); 
            document.getElementById('formNuevaTarea').style.display = 'none';
            document.getElementById('inputTarea').value = ''; 
            document.getElementById('inputProyecto').value = '';
        } else { alert("Escribe qué hay que hacer."); }
    });

    window.completarTarea = function(index) {
        tareas[index].estado = 'completed';
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
        renderTareas();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };
    window.eliminarTarea = function(index) { if (confirm("¿Eliminar tarea?")) { tareas.splice(index, 1); localStorage.setItem('tareasSpotlight', JSON.stringify(tareas)); renderTareas(); } };

    // MODAL TAREA
    window.abrirModalTarea = function(index) {
        tareaActivaIndex = index; const t = tareas[index];
        document.getElementById('mTareaTitulo').textContent = t.titulo;
        document.getElementById('mTareaAsignado').textContent = `Asignado a: ${t.asignado} | Fecha: ${t.fecha}`;
        document.getElementById('mTareaDesc').textContent = t.desc;
        renderArchivosModal(); document.getElementById('modalTarea').style.display = 'flex';
    }
    
    function renderArchivosModal() {
        const lista = document.getElementById('mTareaArchivos'); lista.innerHTML = '';
        const archivos = tareas[tareaActivaIndex].archivos || [];
        if(archivos.length === 0) { lista.innerHTML = '<p style="color:#666; font-size:0.85rem;">No hay archivos aún.</p>'; } 
        else {
            archivos.forEach(a => {
                // TRUCO PARA FORZAR DESCARGA CON CLOUDINARY
                const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/');
                lista.innerHTML += `<li class="archivo-item" style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><a href="${a.url}" target="_blank" style="color: #fff; text-decoration: none;"><i class="fa-solid fa-file" style="color: #f7c948;"></i> ${a.nombre}</a><a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a></li>`;
            });
        }
    }

    window.subirArchivosTarea = async function(event) {
        if (event) event.preventDefault();
        const input = document.getElementById('inputArchivoTarea'); if(input.files.length === 0) return;
        const boton = document.querySelector('.upload-area button'); const textOrig = boton.innerHTML;
        boton.innerHTML = "Subiendo..."; boton.disabled = true;
        
        for(let i=0; i<input.files.length; i++) {
            const file = input.files[i]; const formData = new FormData();
            formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { tareas[tareaActivaIndex].archivos.push({ nombre: file.name, url: data.secure_url }); } 
                else { alert(`Error de Cloudinary: ${data.error.message}`); }
            } catch (error) { alert(`Error de red`); }
        }
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas)); 
        boton.innerHTML = textOrig; boton.disabled = false; input.value = ''; renderArchivosModal();
    }

    // MODAL PROYECTO
    window.abrirModalProyecto = function(nombreProyecto) {
        document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        const lista = document.getElementById('mProyectoTareas'); lista.innerHTML = '';
        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);
        if(tareasDelProyecto.length === 0) { lista.innerHTML = '<p style="color:#666;">No hay tareas en este proyecto.</p>'; } 
        else {
            tareasDelProyecto.forEach(t => {
                const idx = tareas.findIndex(o => o.id === t.id);
                lista.innerHTML += `<li class="archivo-item" style="justify-content: space-between; cursor: pointer; background: rgba(247, 201, 72, 0.1); border-color: #f7c948;" onclick="cerrarModal(); abrirModalTarea(${idx})"><div><i class="fa-solid fa-folder-open" style="color:#f7c948;"></i><strong style="margin-left:10px; color:white;">${t.titulo}</strong></div><div style="display:flex; gap:10px; align-items:center;"><span>Para: ${t.asignado}</span><i class="fa-solid fa-chevron-right"></i></div></li>`;
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
    let eventos = JSON.parse(localStorage.getItem('eventosSpotlight')) || [];
    let fechaCalendario = new Date();

    window.renderCalendario = function() {
        const grid = document.getElementById('calendarDays'); 
        const display = document.getElementById('monthYearDisplay');
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
    
    document.getElementById('prevMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() - 1); renderCalendario(); });
    document.getElementById('nextMonth').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() + 1); renderCalendario(); });
    // El calendario NO se renderiza al inicio, se renderiza cuando se da clic (abajo en el menú).

    function renderListaEventos() {
        const listaEventos = document.getElementById('listaEventos'); listaEventos.innerHTML = '';
        eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        eventos.forEach(ev => {
            const fechaFormat = new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            listaEventos.innerHTML += `<li class="archivo-item"><i class="fa-solid fa-calendar-check" style="color:#f7c948;"></i><div style="margin-left:10px;"><strong style="color:white; display:block;">${ev.nombre}</strong><span style="font-size:0.85rem; color:#a0a0b8; text-transform: capitalize;">${fechaFormat}</span></div></li>`;
        });
    }
    renderListaEventos();

    document.getElementById('btnAgendarEvento').addEventListener('click', () => {
        const nombre = document.getElementById('inputEvento').value; const fecha = document.getElementById('inputFechaEvento').value;
        if (nombre && fecha) {
            eventos.push({ nombre, fecha }); localStorage.setItem('eventosSpotlight', JSON.stringify(eventos));
            renderCalendario(); renderListaEventos(); document.getElementById('inputEvento').value = '';
        } else { alert("Escribe el nombre y la fecha."); }
    });

    // ================= CLIENTES Y NAVEGACIÓN =================
    let clientesDB = JSON.parse(localStorage.getItem('clientesSpotlight')) || [{ id: 1, nombre: "Panasonic México" }];
    function renderClientes() {
        const listaClientes = document.getElementById('listaClientes'); listaClientes.innerHTML = '';
        clientesDB.forEach(cliente => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})"><i class="fa-solid fa-trash"></i></button>` : '';
            listaClientes.innerHTML += `<li class="archivo-item" style="justify-content: space-between;"><div><i class="fa-solid fa-building" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${cliente.nombre}</strong></div>${botonEliminar}</li>`;
        });
    }
    renderClientes();
    document.getElementById('btnMostrarFormCliente').addEventListener('click', () => { document.getElementById('formNuevoCliente').style.display = document.getElementById('formNuevoCliente').style.display === 'none' ? 'flex' : 'none'; });
    document.getElementById('btnGuardarCliente').addEventListener('click', () => {
        const nombre = document.getElementById('inputCliente').value;
        if (nombre) { clientesDB.push({ id: Date.now(), nombre }); localStorage.setItem('clientesSpotlight', JSON.stringify(clientesDB)); renderClientes(); document.getElementById('formNuevoCliente').style.display = 'none'; document.getElementById('inputCliente').value = ''; }
    });
    window.eliminarCliente = function(id) { if (confirm("¿Eliminar cliente?")) { clientesDB = clientesDB.filter(c => c.id !== id); localStorage.setItem('clientesSpotlight', JSON.stringify(clientesDB)); renderClientes(); } };

    // NAVEGACIÓN (AQUÍ SE ARREGLA EL CALENDARIO)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
            this.classList.add('active');
            
            const target = this.getAttribute('data-target');
            document.getElementById('view-' + target).style.display = 'block';

            // SI SE ABRE EL CALENDARIO, LO DIBUJAMOS AQUÍ MISMO
            if (target === 'calendario') {
                renderCalendario();
            }
        });
    });

    document.getElementById('btnLogout').addEventListener('click', function(e) { e.preventDefault(); localStorage.removeItem('staffLogueado'); window.location.href = "login"; });
});