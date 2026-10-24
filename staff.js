document.addEventListener('DOMContentLoaded', function() {
    
    if (localStorage.getItem('staffLogueado') !== 'true') {
        window.location.href = "login";
        return;
    }

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

    // =========================================================
    // SISTEMA DE PROYECTOS (Se declaran primero para llenar el SELECT)
    // =========================================================
    let proyectosDB = JSON.parse(localStorage.getItem('proyectosSpotlight')) || [
        { id: 1, nombre: "Cortometraje Búho de Oro", cliente: "Interno" }
    ];

    function renderProyectosSelect() {
        const select = document.getElementById('inputProyecto');
        select.innerHTML = '<option value="General">Proyecto General</option>';
        proyectosDB.forEach(p => {
            select.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
        });
    }
    renderProyectosSelect();

    const listaProyectos = document.getElementById('listaProyectos');

    window.renderProyectosLista = function() {
        listaProyectos.innerHTML = '';
        proyectosDB.forEach(p => {
            const botonEliminar = esGerente 
                ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProyecto(${p.id})"><i class="fa-solid fa-trash"></i></button>` 
                : '';

            listaProyectos.innerHTML += `
                <li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="abrirModalProyecto('${p.nombre}')">
                    <div>
                        <i class="fa-solid fa-folder" style="color:#f7c948;"></i> 
                        <strong style="color:white; margin-left:10px;">${p.nombre}</strong>
                    </div>
                    ${botonEliminar}
                </li>
            `;
        });
    }
    renderProyectosLista();

    document.getElementById('btnMostrarFormProyecto').addEventListener('click', () => {
        document.getElementById('formNuevoProyecto').style.display = document.getElementById('formNuevoProyecto').style.display === 'none' ? 'flex' : 'none';
    });

    document.getElementById('btnGuardarProyecto').addEventListener('click', () => {
        const nombre = document.getElementById('inputProyectoNom').value;
        const cliente = document.getElementById('inputClienteProyecto').value || "Sin cliente";
        
        if (nombre) {
            if (proyectosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                alert("Ya existe un proyecto con ese nombre.");
                return;
            }
            proyectosDB.push({ id: Date.now(), nombre, cliente });
            localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
            renderProyectosLista();
            renderProyectosSelect(); // ¡MAGIA! Actualiza el menú desplegable de tareas
            document.getElementById('formNuevoProyecto').style.display = 'none';
            document.getElementById('inputProyectoNom').value = '';
            document.getElementById('inputClienteProyecto').value = '';
        } else {
            alert("Escribe un nombre para el proyecto.");
        }
    });

    window.eliminarProyecto = function(id) {
        if (confirm("¿Eliminar este proyecto? (Las tareas no se borrarán)")) {
            proyectosDB = proyectosDB.filter(p => p.id !== id);
            localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
            renderProyectosLista();
            renderProyectosSelect(); // Actualizamos el menú
        }
    };

    // =========================================================
    // SISTEMA DE TAREAS
    // =========================================================
    const listaTareas = document.getElementById('listaTareas');
    const listaTareasCompletadas = document.getElementById('listaTareasCompletadas');
    const formNuevaTarea = document.getElementById('formNuevaTarea');
    
    let tareas = JSON.parse(localStorage.getItem('tareasSpotlight')) || [
        { id: 1, titulo: "Edición de video - Panasonic", asignado: "Beatriz", fecha: "2026-10-21", estado: "progress", desc: "Cortar el clip de 0:15 a 0:45 y agregar música.", proyecto: "General", archivos: [] }
    ];
    
    let tareaActivaIndex = -1;

    function renderTareas() {
        listaTareas.innerHTML = '';
        listaTareasCompletadas.innerHTML = '';

        tareas.forEach((t, index) => {
            const botonEliminar = esGerente 
                ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarTarea(${index})"><i class="fa-solid fa-trash"></i></button>` 
                : '';
            
            // LÓGICA DE LA PALOMITA: SOLO la persona asignada
            const esAsignado = (nombreStaff.toLowerCase() === t.asignado.toLowerCase());
            const puedeCompletar = esAsignado;

            const botonCompletar = (t.estado !== 'completed' && puedeCompletar)
                ? `<button class="btn-completar" onclick="event.stopPropagation(); completarTarea(${index})" title="Completar"><i class="fa-solid fa-check"></i></button>` 
                : '';

            const htmlTarea = `
                <div class="task-item" style="justify-content: space-between; ${t.estado === 'completed' ? 'opacity: 0.6;' : ''}" onclick="abrirModalTarea(${index})">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="task-status ${t.estado}"></div>
                        <div class="task-details">
                            <h4 style="${t.estado === 'completed' ? 'text-decoration: line-through;' : ''}">${t.titulo}</h4>
                            <p>Para: ${t.asignado} | Proyecto: ${t.proyecto || 'General'}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="task-tag">${t.estado === 'completed' ? 'Completada' : (t.estado === 'progress' ? 'En Proceso' : 'Pendiente')}</span>
                        ${botonCompletar}
                        ${botonEliminar}
                    </div>
                </div>
            `;

            if (t.estado === 'completed') {
                listaTareasCompletadas.innerHTML += htmlTarea;
            } else {
                listaTareas.innerHTML += htmlTarea;
            }
        });
    }
    renderTareas();

    document.getElementById('btnMostrarFormTarea').addEventListener('click', () => {
        formNuevaTarea.style.display = formNuevaTarea.style.display === 'none' ? 'flex' : 'none';
    });

    document.getElementById('btnGuardarTarea').addEventListener('click', () => {
        const titulo = document.getElementById('inputTarea').value;
        const asignado = document.getElementById('inputAsignado').value;
        const fecha = document.getElementById('inputFecha').value;
        const proyecto = document.getElementById('inputProyecto').value; // Toma el valor del SELECT
        const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones.";

        if (titulo && asignado) {
            tareas.unshift({ id: Date.now(), titulo, asignado, fecha, estado: 'pending', desc, proyecto, archivos: [] });
            localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
            renderTareas();
            formNuevaTarea.style.display = 'none';
            document.getElementById('inputTarea').value = '';
            document.getElementById('inputAsignado').value = '';
            document.getElementById('inputDescripcionTarea').value = '';
        } else {
            alert("Por favor, escribe la tarea y a quién se la asignas.");
        }
    });

    window.completarTarea = function(index) {
        tareas[index].estado = 'completed';
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
        renderTareas();
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f7c948', '#ff9a3c', '#ff5e94', '#ffffff'] });
    };

    window.eliminarTarea = function(index) {
        if (confirm("¿Seguro que quieres eliminar esta tarea?")) {
            tareas.splice(index, 1);
            localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
            renderTareas();
        }
    };

    const modalTarea = document.getElementById('modalTarea');

    window.abrirModalTarea = function(index) {
        tareaActivaIndex = index;
        const t = tareas[index];
        document.getElementById('mTareaTitulo').textContent = t.titulo;
        document.getElementById('mTareaAsignado').textContent = `Asignado a: ${t.asignado} | Fecha: ${t.fecha}`;
        document.getElementById('mTareaDesc').textContent = t.desc || "Sin instrucciones.";
        renderArchivosModal();
        modalTarea.style.display = 'flex';
    }

    function renderArchivosModal() {
        const lista = document.getElementById('mTareaArchivos');
        lista.innerHTML = '';
        const archivos = tareas[tareaActivaIndex].archivos || [];
        
        if(archivos.length === 0) {
            lista.innerHTML = '<p style="color:#666; font-size:0.85rem;">No hay archivos aún.</p>';
        } else {
            archivos.forEach(a => {
                const url = typeof a === 'object' ? a.url : '#';
                const nombre = typeof a === 'object' ? a.nombre : a;

                lista.innerHTML += `
                    <li class="archivo-item" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <a href="${url}" target="_blank" style="color: #fff; text-decoration: none; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <i class="fa-solid fa-file" style="color: #f7c948;"></i> ${nombre}
                        </a>
                        <!-- Enviamos la URL y el nombre a la función de descarga JS -->
                        <button class="btn-descargar" onclick="descargarArchivo('${url}', '${nombre}')" title="Descargar archivo">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </li>
                `;
            });
        }
    }

    // NUEVA FUNCIÓN PARA FORZAR LA DESCARGA
    window.descargarArchivo = async function(url, nombre) {
        try {
            // Fetch descarga el archivo real, evitando que el navegador lo abra
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Creamos un enlace invisible para forzar la descarga
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = nombre; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            alert("Error de red al descargar. Abriendo en nueva pestaña.");
            window.open(url, '_blank');
        }
    }

    window.subirArchivosTarea = async function(event) {
        if (event && event.preventDefault) { event.preventDefault(); }
        
        const input = document.getElementById('inputArchivoTarea');
        if(input.files.length === 0) return;

        const boton = document.querySelector('.upload-area button');
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = "Subiendo...";
        boton.disabled = true;

        for(let i=0; i<input.files.length; i++) {
            const file = input.files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.secure_url) {
                    tareas[tareaActivaIndex].archivos.push({ nombre: file.name, url: data.secure_url });
                } else {
                    alert(`Error al subir ${file.name}`);
                }
            } catch (error) {
                console.error("Error de subida:", error);
                alert(`Error de conexión al subir ${file.name}`);
            }
        }
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
        input.value = ''; 
        renderArchivosModal();
        alert("¡Archivos subidos a la nube con éxito!");
    }

    const modalProyecto = document.getElementById('modalProyecto');

    window.abrirModalProyecto = function(nombreProyecto) {
        document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        const lista = document.getElementById('mProyectoTareas');
        lista.innerHTML = '';

        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);

        if(tareasDelProyecto.length === 0) {
            lista.innerHTML = '<p style="color:#666;">No hay tareas asignadas a este proyecto.</p>';
        } else {
            tareasDelProyecto.forEach(t => {
                const tareaIndexOriginal = tareas.findIndex(original => original.id === t.id);
                lista.innerHTML += `
                    <li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="cerrarModal(); abrirModalTarea(${tareaIndexOriginal})">
                        <div>
                            <i class="fa-solid fa-folder-open" style="color:${t.estado === 'completed' ? '#4CAF50' : '#f7c948'};"></i>
                            <span style="margin-left:10px; color:white;">${t.titulo}</span>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-size:0.8rem; color:#a0a0b8;">Para: ${t.asignado}</span>
                            <i class="fa-solid fa-chevron-right" style="color:#a0a0b8;"></i>
                        </div>
                    </li>
                `;
            });
        }
        modalProyecto.style.display = 'flex';
    }

    window.cerrarModal = function() {
        modalTarea.style.display = 'none';
        modalProyecto.style.display = 'none';
    }

    // =========================================================
    // CLIENTES Y CALENDARIO
    // =========================================================
    const listaClientes = document.getElementById('listaClientes');
    let clientesDB = JSON.parse(localStorage.getItem('clientesSpotlight')) || [
        { id: 1, nombre: "Panasonic México" },
        { id: 2, nombre: "TV Azteca" }
    ];

    function renderClientes() {
        listaClientes.innerHTML = '';
        clientesDB.forEach(cliente => {
            const botonEliminar = esGerente 
                ? `<button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})"><i class="fa-solid fa-trash"></i></button>` 
                : '';
            listaClientes.innerHTML += `
                <li class="archivo-item" style="justify-content: space-between;">
                    <div>
                        <i class="fa-solid fa-building" style="color:#f7c948;"></i> 
                        <strong style="color:white; margin-left:10px;">${cliente.nombre}</strong>
                    </div>
                    ${botonEliminar}
                </li>
            `;
        });
    }
    renderClientes();

    document.getElementById('btnMostrarFormCliente').addEventListener('click', () => {
        document.getElementById('formNuevoCliente').style.display = document.getElementById('formNuevoCliente').style.display === 'none' ? 'flex' : 'none';
    });

    document.getElementById('btnGuardarCliente').addEventListener('click', () => {
        const nombre = document.getElementById('inputCliente').value;
        if (nombre) {
            clientesDB.push({ id: Date.now(), nombre });
            localStorage.setItem('clientesSpotlight', JSON.stringify(clientesDB));
            renderClientes();
            document.getElementById('formNuevoCliente').style.display = 'none';
            document.getElementById('inputCliente').value = '';
        }
    });

    window.eliminarCliente = function(id) {
        if (confirm("¿Eliminar este cliente?")) {
            clientesDB = clientesDB.filter(c => c.id !== id);
            localStorage.setItem('clientesSpotlight', JSON.stringify(clientesDB));
            renderClientes();
        }
    };

    const listaEventos = document.getElementById('listaEventos');
    let eventos = JSON.parse(localStorage.getItem('eventosSpotlight')) || [];

    function renderEventos() {
        listaEventos.innerHTML = '';
        eventos.forEach(ev => {
            listaEventos.innerHTML += `
                <li class="archivo-item">
                    <i class="fa-solid fa-calendar-check" style="color:#f7c948;"></i> 
                    ${ev.nombre} - <strong>${ev.fecha}</strong>
                </li>
            `;
        });
    }
    renderEventos();

    document.getElementById('btnAgendarEvento').addEventListener('click', () => {
        const nombre = document.getElementById('inputEvento').value;
        const fecha = document.getElementById('inputFechaEvento').value;
        if (nombre && fecha) {
            eventos.push({ nombre, fecha });
            localStorage.setItem('eventosSpotlight', JSON.stringify(eventos));
            renderEventos();
            document.getElementById('inputEvento').value = '';
        } else {
            alert("Escribe el nombre del evento y selecciona una fecha.");
        }
    });

    // NAVEGACIÓN Y LOGOUT
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');
            this.classList.add('active');
            document.getElementById('view-' + this.getAttribute('data-target')).style.display = 'block';
        });
    });

    document.getElementById('btnLogout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('staffLogueado');
        window.location.href = "login";
    });
});