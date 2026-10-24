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
    }

    // FUNCIÓN GLOBAL PARA ABRIR/CERRAR FORMULARIOS (Evita fallos con los botones)
    window.toggleForm = function(idFormulario) {
        const form = document.getElementById(idFormulario);
        if (form) {
            if (form.style.display === 'none' || form.style.display === '') {
                form.style.display = 'flex';
            } else {
                form.style.display = 'none';
            }
        }
    };

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
        
        if (noLeidas > 0) { badge.textContent = noLeidas; badge.style.display = 'flex'; } 
        else { badge.style.display = 'none'; }
        
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

    if (btnNotificaciones) {
        btnNotificaciones.addEventListener('click', () => {
            panelNotificaciones.style.display = panelNotificaciones.style.display === 'block' ? 'none' : 'block';
            notificaciones.forEach(n => { if(n.para === nombreStaff) n.leida = true; });
            localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
            renderNotificaciones();
        });
    }

    // ================= SISTEMA DE EXÁMENES =================
    let examenesDB = JSON.parse(localStorage.getItem('examenesSpotlight')) || [];
    let resultadosDB = JSON.parse(localStorage.getItem('resultadosSpotlight')) || [];
    let examenActivoId = null;

    const listaExamenes = document.getElementById('listaExamenes');
    const tablaResultados = document.getElementById('tablaResultados');
    const contenedorPreguntas = document.getElementById('contenedorPreguntas');

    // 1. Crear Examen (Añadir preguntas)
    function crearBloquePregunta() {
        if(!contenedorPreguntas) return;
        const bloque = document.createElement('div');
        bloque.className = 'pregunta-bloque';
        bloque.innerHTML = `
            <input type="text" class="p-pregunta" placeholder="Escribe la pregunta..." style="width: 100%; margin-bottom: 10px;">
            <div style="display: flex; gap: 10px;">
                <input type="text" class="p-opA" placeholder="Opción A" style="flex:1;">
                <input type="text" class="p-opB" placeholder="Opción B" style="flex:1;">
            </div>
            <select class="p-correcta" style="width: 100%; margin-top: 10px; padding: 10px; background: #05050f; color: white; border-radius: 8px; border: 1px solid #333;">
                <option value="A">Correcta: Opción A</option>
                <option value="B">Correcta: Opción B</option>
            </select>
        `;
        contenedorPreguntas.appendChild(bloque);
    }
    
    if (document.getElementById('contenedorPreguntas')) {
        crearBloquePregunta(); // Iniciar con un bloque vacío
        
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
                if (preg && opA && opB) {
                    preguntas.push({ pregunta: preg, opcionA: opA, opcionB: opB, correcta: corr });
                }
            });

            if (preguntas.length === 0) { alert("Debes llenar al menos una pregunta completa."); return; }

            examenesDB.push({ id: Date.now(), titulo, preguntas });
            localStorage.setItem('examenesSpotlight', JSON.stringify(examenesDB));
            
            // Limpiar formulario
            document.getElementById('examenTitulo').value = '';
            contenedorPreguntas.innerHTML = '';
            crearBloquePregunta(); 
            document.getElementById('formNuevoExamen').style.display = 'none';
            
            renderExamenes();
        });
    }

    // 2. Renderizar Exámenes y Tabla de Resultados
    window.renderExamenes = function() {
        if(!listaExamenes) return;
        listaExamenes.innerHTML = '';
        
        if(examenesDB.length === 0) {
            listaExamenes.innerHTML = '<p style="color:#666;">No hay exámenes publicados aún.</p>';
        } else {
            examenesDB.forEach((ex) => {
                const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarExamen(${ex.id})" style="margin-left: 10px;"><i class="fa-solid fa-trash"></i></button>` : '';
                listaExamenes.innerHTML += `
                    <li class="examen-card">
                        <div>
                            <h3>${ex.titulo}</h3>
                            <p style="color:#a0a0b8; font-size: 0.9rem; margin-top: 5px;">${ex.preguntas.length} preguntas</p>
                        </div>
                        <div>
                            ${botonEliminar}
                            <button class="btn-primary" onclick="abrirExamenParaResponder(${ex.id})" style="margin-left: 10px;">Responder</button>
                        </div>
                    </li>
                `;
            });
        }

        // Llenar Tabla de Resultados
        if (tablaResultados) {
            tablaResultados.innerHTML = '';
            if(resultadosDB.length === 0) {
                tablaResultados.innerHTML = '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #666;">Aún no hay resultados registrados.</td></tr>';
            } else {
                [...resultadosDB].reverse().forEach(res => {
                    const color = res.porcentaje >= 70 ? '#4CAF50' : '#ff5e5e';
                    tablaResultados.innerHTML += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 15px; color: white;">${res.alumno}</td>
                            <td style="padding: 15px; color: #a0a0b8;">${res.tituloExamen}</td>
                            <td style="padding: 15px; font-weight: bold; color: ${color};">${res.porcentaje}% (${res.aciertos}/${res.total})</td>
                        </tr>
                    `;
                });
            }
        }
    }
    renderExamenes();

    window.eliminarExamen = function(id) {
        if (confirm("¿Eliminar este examen? (Los resultados se mantendrán)")) {
            examenesDB = examenesDB.filter(ex => ex.id !== id);
            localStorage.setItem('examenesSpotlight', JSON.stringify(examenesDB));
            renderExamenes();
        }
    };

    // 3. Responder Examen
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

    window.cerrarModalExamen = function() {
        document.getElementById('modalExamen').style.display = 'none';
    }

    // 4. Calificar Examen
    if (document.getElementById('btnCalificarExamen')) {
        document.getElementById('btnCalificarExamen').addEventListener('click', () => {
            const examen = examenesDB.find(ex => ex.id === examenActivoId);
            if(!examen) return;

            let aciertos = 0;
            let todasRespondidas = true;

            examen.preguntas.forEach((p, index) => {
                const seleccion = document.querySelector(`input[name="resp_${index}"]:checked`);
                if (!seleccion) {
                    todasRespondidas = false;
                } else if (seleccion.value === p.correcta) {
                    aciertos++;
                }
            });

            if (!todasRespondidas) {
                alert("Por favor, responde todas las preguntas antes de enviar.");
                return;
            }

            const total = examen.preguntas.length;
            const porcentaje = Math.round((aciertos / total) * 100);

            // Guardar en base de datos
            resultadosDB.push({
                id: Date.now(),
                examenId: examen.id,
                tituloExamen: examen.titulo,
                alumno: nombreStaff,
                porcentaje: porcentaje,
                aciertos: aciertos,
                total: total
            });
            localStorage.setItem('resultadosSpotlight', JSON.stringify(resultadosDB));

            cerrarModalExamen();
            renderExamenes(); // Actualiza tabla

            if (porcentaje >= 70) {
                confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
                alert(`¡Felicidades ${nombreStaff}! Has aprobado con un ${porcentaje}% (${aciertos}/${total} aciertos). 🎉`);
            } else {
                alert(`Obtuviste un ${porcentaje}% (${aciertos}/${total} aciertos). Necesitas al menos 70% para aprobar. ¡Sigue practicando! 😢`);
            }
        });
    }

    // ================= PROYECTOS =================
    let proyectosDB = JSON.parse(localStorage.getItem('proyectosSpotlight')) || [{ id: 1, nombre: "Cortometraje Búho de Oro", cliente: "Interno" }];
    
    window.renderProyectosLista = function() {
        const listaProyectos = document.getElementById('listaProyectos'); 
        if(!listaProyectos) return;
        listaProyectos.innerHTML = '';
        
        proyectosDB.forEach(p => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProyecto(${p.id})"><i class="fa-solid fa-trash"></i></button>` : '';
            listaProyectos.innerHTML += `
                <li class="archivo-item" style="justify-content: space-between; cursor: pointer;" onclick="abrirModalProyecto('${p.nombre}')">
                    <div><i class="fa-solid fa-folder" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${p.nombre}</strong></div>
                    ${botonEliminar}
                </li>
            `;
        });
    }
    renderProyectosLista();

    if(document.getElementById('btnGuardarProyecto')) {
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
                } else {
                    alert("Ya existe un proyecto con ese nombre.");
                }
            }
        });
    }

    window.eliminarProyecto = function(id) {
        if (confirm("¿Eliminar este proyecto?")) {
            proyectosDB = proyectosDB.filter(p => p.id !== id);
            localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
            renderProyectosLista();
        }
    };

    // ================= TAREAS =================
    let tareas = JSON.parse(localStorage.getItem('tareasSpotlight')) || [{ id: 1, titulo: "Edición de video - Panasonic", asignado: "Beatriz", fecha: "2026-10-21", estado: "progress", desc: "Cortar el clip", proyecto: "General", archivos: [] }];
    let tareaActivaIndex = -1;

    window.renderTareas = function() {
        const listaTareas = document.getElementById('listaTareas');
        const listaTareasCompletadas = document.getElementById('listaTareasCompletadas');
        if(!listaTareas) return;
        
        listaTareas.innerHTML = ''; listaTareasCompletadas.innerHTML = '';
        
        tareas.forEach((t, index) => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="event.stopPropagation(); eliminarTarea(${index})"><i class="fa-solid fa-trash"></i></button>` : '';
            
            // Solo el asignado ve la palomita
            const esAsignado = (nombreStaff.trim().toLowerCase() === t.asignado.trim().toLowerCase());
            const botonCompletar = (t.estado !== 'completed' && esAsignado) ? `<button class="btn-completar" onclick="event.stopPropagation(); completarTarea(${index})"><i class="fa-solid fa-check"></i></button>` : '';

            const html = `
                <div class="task-item" style="justify-content: space-between; ${t.estado === 'completed' ? 'opacity: 0.6;' : ''}" onclick="abrirModalTarea(${index})">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="task-status ${t.estado}"></div>
                        <div class="task-details">
                            <h4>${t.titulo}</h4>
                            <p>Para: ${t.asignado} | Proyecto: ${t.proyecto}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="task-tag">${t.estado === 'pending' ? 'Pendiente' : (t.estado === 'progress' ? 'En Proceso' : 'Completada')}</span>
                        ${botonCompletar}
                        ${botonEliminar}
                    </div>
                </div>
            `;
            if (t.estado === 'completed') { listaTareasCompletadas.innerHTML += html; } 
            else { listaTareas.innerHTML += html; }
        });
    }
    renderTareas();

    if(document.getElementById('btnGuardarTarea')) {
        document.getElementById('btnGuardarTarea').addEventListener('click', () => {
            const titulo = document.getElementById('inputTarea').value;
            const asignado = document.getElementById('inputAsignado').value;
            const fecha = document.getElementById('inputFecha').value;
            const proyecto = document.getElementById('inputProyecto').value.trim() || "General";
            const desc = document.getElementById('inputDescripcionTarea').value || "Sin instrucciones.";
            
            if (titulo) {
                if (proyecto !== "General" && !proyectosDB.find(p => p.nombre.toLowerCase() === proyecto.toLowerCase())) {
                    proyectosDB.push({ id: Date.now(), nombre: proyecto, cliente: "Sin cliente" });
                    localStorage.setItem('proyectosSpotlight', JSON.stringify(proyectosDB));
                    renderProyectosLista();
                }
                tareas.unshift({ id: Date.now(), titulo, asignado, fecha, estado: 'pending', desc, proyecto, archivos: [] });
                localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
                
                // Notificación
                notificaciones.push({ id: Date.now(), para: asignado, mensaje: `Nueva tarea asignada: ${titulo}`, leida: false });
                localStorage.setItem('notificacionesSpotlight', JSON.stringify(notificaciones));
                renderNotificaciones();

                renderTareas(); 
                document.getElementById('formNuevaTarea').style.display = 'none';
                document.getElementById('inputTarea').value = ''; 
                document.getElementById('inputProyecto').value = '';
            } else { alert("Escribe qué hay que hacer."); }
        });
    }

    window.completarTarea = function(index) {
        tareas[index].estado = 'completed';
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas));
        renderTareas();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };
    
    window.eliminarTarea = function(index) { 
        if (confirm("¿Eliminar tarea?")) { 
            tareas.splice(index, 1); 
            localStorage.setItem('tareasSpotlight', JSON.stringify(tareas)); 
            renderTareas(); 
        } 
    };

    // MODAL DE TAREA Y ARCHIVOS
    window.abrirModalTarea = function(index) {
        tareaActivaIndex = index; 
        const t = tareas[index];
        document.getElementById('mTareaTitulo').textContent = t.titulo;
        document.getElementById('mTareaAsignado').textContent = `Asignado a: ${t.asignado} | Fecha: ${t.fecha}`;
        document.getElementById('mTareaDesc').textContent = t.desc;
        renderArchivosModal(); 
        document.getElementById('modalTarea').style.display = 'flex';
    }
    
    function renderArchivosModal() {
        const lista = document.getElementById('mTareaArchivos'); 
        if(!lista) return;
        lista.innerHTML = '';
        const archivos = tareas[tareaActivaIndex].archivos || [];
        
        if(archivos.length === 0) { 
            lista.innerHTML = '<p style="color:#666; font-size:0.85rem;">No hay archivos aún.</p>'; 
        } else {
            archivos.forEach(a => {
                const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/');
                lista.innerHTML += `
                    <li class="archivo-item" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <a href="${a.url}" target="_blank" style="color: #fff; text-decoration: none;"><i class="fa-solid fa-file" style="color: #f7c948;"></i> ${a.nombre}</a>
                        <a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a>
                    </li>
                `;
            });
        }
    }

    window.subirArchivosTarea = async function(event) {
        if (event) event.preventDefault();
        const input = document.getElementById('inputArchivoTarea'); 
        if(input.files.length === 0) return;
        
        const boton = document.querySelector('.upload-area button'); 
        const textOrig = boton.innerHTML;
        boton.innerHTML = "Subiendo..."; 
        boton.disabled = true;
        
        for(let i=0; i<input.files.length; i++) {
            const file = input.files[i]; 
            const formData = new FormData();
            formData.append('file', file); 
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { 
                    tareas[tareaActivaIndex].archivos.push({ nombre: file.name, url: data.secure_url }); 
                } else { 
                    alert(`Error de Cloudinary: ${data.error.message}`); 
                }
            } catch (error) { 
                alert(`Error de red al subir archivo`); 
            }
        }
        localStorage.setItem('tareasSpotlight', JSON.stringify(tareas)); 
        boton.innerHTML = textOrig; 
        boton.disabled = false; 
        input.value = ''; 
        renderArchivosModal();
    }

    // MODAL PROYECTO
    window.abrirModalProyecto = function(nombreProyecto) {
        document.getElementById('mProyectoTitulo').textContent = nombreProyecto;
        const lista = document.getElementById('mProyectoTareas'); 
        lista.innerHTML = '';
        const tareasDelProyecto = tareas.filter(t => t.proyecto === nombreProyecto);
        
        if(tareasDelProyecto.length === 0) { 
            lista.innerHTML = '<p style="color:#666;">No hay tareas en este proyecto.</p>'; 
        } else {
            tareasDelProyecto.forEach(t => {
                const idx = tareas.findIndex(o => o.id === t.id);
                lista.innerHTML += `
                    <li class="archivo-item" style="justify-content: space-between; cursor: pointer; background: rgba(247, 201, 72, 0.1); border-color: #f7c948;" onclick="cerrarModal(); abrirModalTarea(${idx})">
                        <div><i class="fa-solid fa-folder-open" style="color:#f7c948;"></i><strong style="margin-left:10px; color:white;">${t.titulo}</strong></div>
                        <div style="display:flex; gap:10px; align-items:center;"><span>Para: ${t.asignado}</span><i class="fa-solid fa-chevron-right"></i></div>
                    </li>
                `;
                if (t.archivos) {
                    t.archivos.forEach(a => {
                        const urlDescarga = a.url.replace('/upload/', '/upload/fl_attachment/');
                        lista.innerHTML += `
                            <li class="archivo-item" style="margin-left: 20px; border-left: 2px solid #f7c948; background: transparent; display: flex; justify-content: space-between;">
                                <a href="${a.url}" target="_blank" style="color: #a0a0b8; text-decoration: none;"><i class="fa-solid fa-file"></i> ${a.nombre}</a>
                                <a href="${urlDescarga}" class="btn-descargar" target="_blank"><i class="fa-solid fa-download"></i></a>
                            </li>
                        `;
                    });
                }
            });
        }
        document.getElementById('modalProyecto').style.display = 'flex';
    }
    
    window.cerrarModal = function() { 
        document.getElementById('modalTarea').style.display = 'none'; 
        document.getElementById('modalProyecto').style.display = 'none'; 
    }

    // ================= CALENDARIO =================
    let eventos = JSON.parse(localStorage.getItem('eventosSpotlight')) || [];
    let fechaCalendario = new Date();

    window.renderCalendario = function() {
        const grid = document.getElementById('calendarDays'); 
        const display = document.getElementById('monthYearDisplay');
        if(!grid) return;
        grid.innerHTML = '';
        
        const year = fechaCalendario.getFullYear(); 
        const month = fechaCalendario.getMonth();
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        display.textContent = `${meses[month]} ${year}`;
        
        const primerDia = new Date(year, month, 1).getDay(); 
        const diasEnMes = new Date(year, month + 1, 0).getDate();
        
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
        const listaEventos = document.getElementById('listaEventos'); 
        if(!listaEventos) return;
        listaEventos.innerHTML = '';
        eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        eventos.forEach(ev => {
            const fechaFormat = new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            listaEventos.innerHTML += `
                <li class="archivo-item">
                    <i class="fa-solid fa-calendar-check" style="color:#f7c948;"></i>
                    <div style="margin-left:10px;"><strong style="color:white; display:block;">${ev.nombre}</strong><span style="font-size:0.85rem; color:#a0a0b8; text-transform: capitalize;">${fechaFormat}</span></div>
                </li>
            `;
        });
    }
    renderListaEventos();

    if(document.getElementById('btnAgendarEvento')) {
        document.getElementById('btnAgendarEvento').addEventListener('click', () => {
            const nombre = document.getElementById('inputEvento').value; 
            const fecha = document.getElementById('inputFechaEvento').value;
            if (nombre && fecha) {
                eventos.push({ nombre, fecha }); 
                localStorage.setItem('eventosSpotlight', JSON.stringify(eventos));
                renderCalendario(); 
                renderListaEventos(); 
                document.getElementById('inputEvento').value = '';
            } else { alert("Escribe el nombre y la fecha."); }
        });
    }

    // ================= CLIENTES =================
    let clientesDB = JSON.parse(localStorage.getItem('clientesSpotlight')) || [{ id: 1, nombre: "Panasonic México" }];
    
    window.renderClientes = function() {
        const listaClientes = document.getElementById('listaClientes'); 
        if(!listaClientes) return;
        listaClientes.innerHTML = '';
        
        clientesDB.forEach(cliente => {
            const botonEliminar = esGerente ? `<button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})"><i class="fa-solid fa-trash"></i></button>` : '';
            listaClientes.innerHTML += `
                <li class="archivo-item" style="justify-content: space-between;">
                    <div><i class="fa-solid fa-building" style="color:#f7c948;"></i> <strong style="color:white; margin-left:10px;">${cliente.nombre}</strong></div>
                    ${botonEliminar}
                </li>
            `;
        });
    }
    renderClientes();

    if(document.getElementById('btnGuardarCliente')) {
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
    }

    window.eliminarCliente = function(id) { 
        if (confirm("¿Eliminar cliente?")) { 
            clientesDB = clientesDB.filter(c => c.id !== id); 
            localStorage.setItem('clientesSpotlight', JSON.stringify(clientesDB)); 
            renderClientes(); 
        } 
    };

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
        });
    });

    document.getElementById('btnLogout').addEventListener('click', function(e) { 
        e.preventDefault(); 
        localStorage.removeItem('staffLogueado'); 
        window.location.href = "login"; 
    });
});