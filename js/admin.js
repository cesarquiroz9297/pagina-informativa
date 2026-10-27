/**
 * ============================================================================
 * Script del Panel Administrativo conectado a SQL Server 2022 (DB_IE82115_JFSC)
 * Institución: I.E. N° 82115 "José Faustino Sánchez Carrión" - Huamachuco
 * UGEL Sánchez Carrión - DRE La Libertad
 * Autor: César Quiroz
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Referencias de vistas y autenticación
  const vistaLogin = document.getElementById('vista-login');
  const vistaDashboard = document.getElementById('vista-dashboard');
  const formLogin = document.getElementById('form-login');
  const errorLogin = document.getElementById('error-login');
  const textoErrorLogin = document.getElementById('texto-error-login');
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  const btnRecargarSql = document.getElementById('btn-recargar-sql');

  // Estado local cargado desde SQL Server 2022
  let datosSql = {
    estadisticas: null,
    solicitudes: [],
    noticias: [],
    vacantes: [],
    comunicados: [],
  };

  // Mostrar notificación de confirmación
  const mostrarNotificacion = (mensaje) => {
    const alerta = document.getElementById('notificacion-admin');
    const texto = document.getElementById('texto-notificacion-admin');
    if (!alerta || !texto) return;
    texto.textContent = mensaje;
    alerta.classList.remove('hidden');
    setTimeout(() => {
      alerta.classList.add('hidden');
    }, 3500);
  };

  /* --------------------------------------------------------------------------
   * 1. AUTENTICACIÓN CONTRA SQL SERVER (`dbo.UsuariosAdministradores`)
   * -------------------------------------------------------------------------- */
  const verificarSesionGuardada = () => {
    const sesion = sessionStorage.getItem('sesion_admin_ie82115');
    if (sesion) {
      const usuario = JSON.parse(sesion);
      activarDashboard(usuario);
    }
  };

  const activarDashboard = (usuario) => {
    document.getElementById('admin-nombre-activo').textContent = usuario.NombreCompleto || 'Administrador';
    document.getElementById('admin-cargo-activo').textContent = `${usuario.Cargo || 'Dirección'} (${usuario.Rol || 'Admin'})`;
    vistaLogin.classList.add('hidden');
    vistaDashboard.classList.remove('hidden');
    cargarDatosDesdeSqlServer();
  };

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorLogin.classList.add('hidden');

    const usuario = document.getElementById('login-usuario').value.trim();
    const clave = document.getElementById('login-clave').value.trim();

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, clave }),
      });
      const data = await resp.json();

      if (data.ok) {
        sessionStorage.setItem('sesion_admin_ie82115', JSON.stringify(data.usuario));
        activarDashboard(data.usuario);
      } else {
        textoErrorLogin.textContent = data.mensaje || 'Credenciales incorrectas.';
        errorLogin.classList.remove('hidden');
      }
    } catch (err) {
      // Modo compatible con GitHub Pages cuando se abre en internet sin el servidor local
      if (
        (usuario === 'admin' && clave === 'faustiniano2026') ||
        (usuario === 'secretaria' && clave === 'huamachuco2026')
      ) {
        const usuarioDemo = {
          NombreCompleto: usuario === 'admin' ? 'Dirección General I.E. 82115' : 'Mesa de Partes y SIAGIE',
          Cargo: 'Modo Web GitHub Pages',
          Rol: 'Administrador',
        };
        sessionStorage.setItem('sesion_admin_ie82115', JSON.stringify(usuarioDemo));
        activarDashboard(usuarioDemo);
      } else {
        textoErrorLogin.textContent = 'Usuario o contraseña incorrectos.';
        errorLogin.classList.remove('hidden');
      }
    }
  });

  btnCerrarSesion?.addEventListener('click', () => {
    sessionStorage.removeItem('sesion_admin_ie82115');
    vistaDashboard.classList.add('hidden');
    vistaLogin.classList.remove('hidden');
  });

  /* --------------------------------------------------------------------------
   * 2. NAVEGACIÓN POR PESTAÑAS DEL PANEL ADMINISTRATIVO
   * -------------------------------------------------------------------------- */
  const botonesTab = document.querySelectorAll('.btn-tab-admin');
  const panelesTab = document.querySelectorAll('.panel-tab');

  botonesTab.forEach((boton) => {
    boton.addEventListener('click', () => {
      const idDestino = boton.getAttribute('data-tab');

      botonesTab.forEach((b) => {
        b.classList.remove('bg-faustiniano-900', 'text-white', 'shadow');
        b.classList.add('bg-white', 'text-slate-700');
      });
      boton.classList.add('bg-faustiniano-900', 'text-white', 'shadow');
      boton.classList.remove('bg-white', 'text-slate-700');

      panelesTab.forEach((panel) => {
        if (panel.id === idDestino) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
   * 3. CARGAR TODOS LOS DATOS EN VIVO DESDE SQL SERVER 2022
   * -------------------------------------------------------------------------- */
  const cargarDatosDesdeSqlServer = async () => {
    try {
      const respuesta = await fetch('/api/admin/datos');
      const data = await respuesta.json();
      if (!data.ok) return;

      datosSql.estadisticas = data.estadisticas;
      datosSql.solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : data.solicitudes ? [data.solicitudes] : [];
      datosSql.noticias = Array.isArray(data.noticias) ? data.noticias : data.noticias ? [data.noticias] : [];
      datosSql.vacantes = Array.isArray(data.vacantes) ? data.vacantes : data.vacantes ? [data.vacantes] : [];
      datosSql.comunicados = Array.isArray(data.comunicados) ? data.comunicados : data.comunicados ? [data.comunicados] : [];

      actualizarKpis();
      renderizarTablaSolicitudes();
      renderizarNoticiasAdmin();
      rellenarFormularioEstadisticas();
      renderizarComunicadosAdmin();
    } catch (error) {
      console.error('Error al consultar SQL Server:', error);
    }
  };

  btnRecargarSql?.addEventListener('click', () => {
    cargarDatosDesdeSqlServer();
    mostrarNotificacion('Datos sincronizados en tiempo real desde SQL Server 2022.');
  });

  const actualizarKpis = () => {
    const totalSol = datosSql.solicitudes.length;
    const pendientes = datosSql.solicitudes.filter((s) => s.Estado === 'Pendiente').length;
    const totalNot = datosSql.noticias.length;
    const totalVac = datosSql.vacantes.reduce((acc, v) => acc + (parseInt(v.VacantesDisponibles, 10) || 0), 0);

    document.getElementById('kpi-total-solicitudes').textContent = totalSol;
    document.getElementById('kpi-pendientes').textContent = pendientes;
    document.getElementById('kpi-noticias').textContent = totalNot;
    document.getElementById('kpi-vacantes').textContent = totalVac;
  };

  /* --------------------------------------------------------------------------
   * 4. GESTIÓN DE SOLICITUDES DE MATRÍCULA Y MESA DE PARTES (`SolicitudesAdmision`)
   * -------------------------------------------------------------------------- */
  const inputBuscarSolicitud = document.getElementById('buscar-solicitud');
  const selectFiltroEstado = document.getElementById('filtro-estado-solicitud');
  const tbodySolicitudes = document.getElementById('tabla-solicitudes-body');

  const renderizarTablaSolicitudes = () => {
    if (!tbodySolicitudes) return;

    const textoBusqueda = (inputBuscarSolicitud?.value || '').toLowerCase().trim();
    const estadoFiltro = selectFiltroEstado?.value || 'Todos';

    const filtradas = datosSql.solicitudes.filter((sol) => {
      const coincideEstado = estadoFiltro === 'Todos' || sol.Estado === estadoFiltro;
      const coincideTexto =
        !textoBusqueda ||
        (sol.NombreApoderado || '').toLowerCase().includes(textoBusqueda) ||
        (sol.DniApoderado || '').toLowerCase().includes(textoBusqueda) ||
        (sol.CodigoExpediente || '').toLowerCase().includes(textoBusqueda);
      return coincideEstado && coincideTexto;
    });

    if (filtradas.length === 0) {
      tbodySolicitudes.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-slate-500">
            No se encontraron solicitudes con los filtros seleccionados.
          </td>
        </tr>`;
      return;
    }

    tbodySolicitudes.innerHTML = filtradas
      .map((sol) => {
        const badgeColor =
          sol.Estado === 'Atendido'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : sol.Estado === 'En Revisión'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-amber-100 text-amber-800 border-amber-300';

        const telLimpio = String(sol.Telefono || '').replace(/\D/g, '');
        const mensajeWhatsapp = encodeURIComponent(
          `Hola ${sol.NombreApoderado}, le saludamos de la Secretaría de la I.E. N° 82115 "José Faustino Sánchez Carrión" de Huamachuco respecto a su expediente ${sol.CodigoExpediente} (${sol.MotivoConsulta} - ${sol.NivelInteres}).`
        );

        return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3.5 px-4 align-top">
            <span class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-faustiniano-900 border border-slate-200 block w-fit">
              ${sol.CodigoExpediente}
            </span>
            <span class="text-[11px] text-slate-500 mt-1 block">${sol.FechaRegistro || ''}</span>
          </td>
          <td class="py-3.5 px-4 align-top">
            <p class="font-bold text-faustiniano-900">${sol.NombreApoderado}</p>
            <p class="text-xs text-slate-600">DNI: <strong>${sol.DniApoderado}</strong> &bull; Cel: <strong>${sol.Telefono}</strong></p>
            ${sol.Correo ? `<p class="text-[11px] text-slate-500">${sol.Correo}</p>` : ''}
          </td>
          <td class="py-3.5 px-4 align-top">
            <span class="font-bold text-xs text-blue-800 block">${sol.NivelInteres}</span>
            <span class="text-xs text-slate-600">${sol.MotivoConsulta}</span>
          </td>
          <td class="py-3.5 px-4 align-top max-w-xs">
            <p class="text-xs text-slate-700 leading-relaxed">${sol.Mensaje}</p>
          </td>
          <td class="py-3.5 px-4 align-top">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor} mb-1.5">
              ${sol.Estado}
            </span>
            <select
              data-cambiar-estado="${sol.IdSolicitud}"
              class="block w-full px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
            >
              <option value="Pendiente" ${sol.Estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="En Revisión" ${sol.Estado === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
              <option value="Atendido" ${sol.Estado === 'Atendido' ? 'selected' : ''}>Atendido</option>
            </select>
          </td>
          <td class="py-3.5 px-4 align-top text-right space-x-1 whitespace-nowrap">
            <a
              href="https://wa.me/51${telLimpio}?text=${mensajeWhatsapp}"
              target="_blank"
              rel="noopener noreferrer"
              title="Responder por WhatsApp"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition"
            >
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button
              type="button"
              data-eliminar-solicitud="${sol.IdSolicitud}"
              title="Eliminar registro de SQL Server"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition"
            >
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </td>
        </tr>`;
      })
      .join('');

    // Eventos para cambiar estado directamente en SQL Server
    tbodySolicitudes.querySelectorAll('[data-cambiar-estado]').forEach((select) => {
      select.addEventListener('change', async () => {
        const idSolicitud = parseInt(select.getAttribute('data-cambiar-estado'), 10);
        const nuevoEstado = select.value;
        await fetch('/api/solicitudes/estado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idSolicitud,
            estado: nuevoEstado,
            observacion: `Actualizado a ${nuevoEstado} desde el Panel Administrativo`,
          }),
        });
        mostrarNotificacion(`Expediente actualizado a "${nuevoEstado}" en SQL Server.`);
        cargarDatosDesdeSqlServer();
      });
    });

    // Eventos para eliminar solicitud en SQL Server
    tbodySolicitudes.querySelectorAll('[data-eliminar-solicitud]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idSolicitud = parseInt(btn.getAttribute('data-eliminar-solicitud'), 10);
        await fetch('/api/solicitudes/eliminar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idSolicitud }),
        });
        mostrarNotificacion('Solicitud eliminada de SQL Server.');
        cargarDatosDesdeSqlServer();
      });
    });
  };

  inputBuscarSolicitud?.addEventListener('input', renderizarTablaSolicitudes);
  selectFiltroEstado?.addEventListener('change', renderizarTablaSolicitudes);

  /* --------------------------------------------------------------------------
   * 5. GESTIÓN DE NOTICIAS Y EVENTOS (`dbo.NoticiasEventos`) + SUBIDA DE IMAGEN
   * -------------------------------------------------------------------------- */
  const formNoticia = document.getElementById('form-noticia');
  const listaNoticiasAdmin = document.getElementById('lista-noticias-admin');
  const btnCancelarEdicionNoticia = document.getElementById('btn-cancelar-edicion-noticia');
  const tituloFormNoticia = document.getElementById('titulo-form-noticia');
  const inputArchivoImagen = document.getElementById('noticia-archivo-imagen');
  const vistaPreviaImagen = document.getElementById('vista-previa-imagen');
  const nombreArchivoSpan = document.getElementById('nombre-archivo-seleccionado');
  const badgeEstadoImagen = document.getElementById('badge-estado-imagen');

  // Al elegir una foto desde el dispositivo (PC o celular), subirla a img/eventos/
  inputArchivoImagen?.addEventListener('change', (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    nombreArchivoSpan.textContent = `Subiendo: ${archivo.name}...`;
    const lector = new FileReader();

    lector.onload = async (eventoLectura) => {
      const base64Data = eventoLectura.target?.result;
      if (!base64Data) return;

      // Mostrar vista previa inmediata en pantalla
      if (vistaPreviaImagen) vistaPreviaImagen.src = base64Data;

      try {
        const resp = await fetch('/api/subir-imagen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombreArchivo: archivo.name,
            base64: base64Data,
          }),
        });
        const data = await resp.json();

        if (data.ok && data.ruta) {
          document.getElementById('noticia-imagen').value = data.ruta;
          nombreArchivoSpan.textContent = `Foto guardada en: ${data.ruta}`;
          if (badgeEstadoImagen) badgeEstadoImagen.textContent = data.ruta;
          mostrarNotificacion(`Imagen subida desde tu dispositivo a ${data.ruta}`);
        } else {
          document.getElementById('noticia-imagen').value = base64Data;
          nombreArchivoSpan.textContent = `Foto cargada: ${archivo.name}`;
        }
      } catch (err) {
        // Respaldo automático si se usa en GitHub Pages sin servidor local
        document.getElementById('noticia-imagen').value = base64Data;
        nombreArchivoSpan.textContent = `Foto lista: ${archivo.name}`;
      }
    };

    lector.readAsDataURL(archivo);
  });

  const renderizarNoticiasAdmin = () => {
    if (!listaNoticiasAdmin) return;
    listaNoticiasAdmin.innerHTML = datosSql.noticias
      .map(
        (n) => `
      <div class="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between">
        <div>
          <div class="relative h-36 overflow-hidden">
            <img src="${n.ImagenUrl}" alt="${n.Titulo}" class="w-full h-full object-cover" />
            <span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-faustiniano-900 text-white">
              ${n.EtiquetaVisible}
            </span>
          </div>
          <div class="p-4">
            <p class="text-[11px] font-semibold text-amber-700">${n.UbicacionFecha}</p>
            <h4 class="font-extrabold text-sm text-faustiniano-900 mt-0.5 line-clamp-2">${n.Titulo}</h4>
            <p class="text-xs text-slate-600 mt-1 line-clamp-2">${n.Resumen}</p>
          </div>
        </div>
        <div class="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase text-slate-400">ID SQL: #${n.IdNoticia}</span>
          <div class="space-x-1.5">
            <button type="button" data-editar-noticia="${n.IdNoticia}" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-700 text-blue-800 hover:text-white text-xs font-bold transition">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button type="button" data-eliminar-noticia="${n.IdNoticia}" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-bold transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>`
      )
      .join('');

    // Botones Editar Noticia
    listaNoticiasAdmin.querySelectorAll('[data-editar-noticia]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-editar-noticia'), 10);
        const item = datosSql.noticias.find((x) => x.IdNoticia === id);
        if (!item) return;

        document.getElementById('noticia-id').value = item.IdNoticia;
        document.getElementById('noticia-titulo').value = item.Titulo;
        document.getElementById('noticia-categoria').value = item.Categoria;
        document.getElementById('noticia-etiqueta').value = item.EtiquetaVisible;
        document.getElementById('noticia-ubicacion').value = item.UbicacionFecha;
        document.getElementById('noticia-imagen').value = item.ImagenUrl;
        document.getElementById('noticia-resumen').value = item.Resumen;

        if (vistaPreviaImagen) vistaPreviaImagen.src = item.ImagenUrl;
        if (nombreArchivoSpan) nombreArchivoSpan.textContent = 'Haz clic si deseas cambiar la foto actual';
        if (badgeEstadoImagen) badgeEstadoImagen.textContent = 'Imagen Actual';

        tituloFormNoticia.textContent = `Editando Evento #${item.IdNoticia}`;
        btnCancelarEdicionNoticia.classList.remove('hidden');
        formNoticia.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Botones Eliminar Noticia
    listaNoticiasAdmin.querySelectorAll('[data-eliminar-noticia]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idNoticia = parseInt(btn.getAttribute('data-eliminar-noticia'), 10);
        await fetch('/api/noticias/eliminar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idNoticia }),
        });
        mostrarNotificacion('Evento eliminado de SQL Server 2022.');
        cargarDatosDesdeSqlServer();
      });
    });
  };

  const limpiarFormularioNoticia = () => {
    formNoticia.reset();
    document.getElementById('noticia-id').value = '0';
    if (vistaPreviaImagen) vistaPreviaImagen.src = 'img/logo.png';
    if (nombreArchivoSpan) nombreArchivoSpan.textContent = 'Haz clic aquí para elegir una foto de tu PC o celular';
    if (badgeEstadoImagen) badgeEstadoImagen.textContent = 'Vista Previa';
    tituloFormNoticia.textContent = 'Publicar Nueva Noticia o Evento Escolar';
    btnCancelarEdicionNoticia.classList.add('hidden');
  };

  btnCancelarEdicionNoticia?.addEventListener('click', limpiarFormularioNoticia);

  formNoticia?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      idNoticia: parseInt(document.getElementById('noticia-id').value || '0', 10),
      titulo: document.getElementById('noticia-titulo').value.trim(),
      categoria: document.getElementById('noticia-categoria').value,
      etiqueta: document.getElementById('noticia-etiqueta').value.trim(),
      ubicacion: document.getElementById('noticia-ubicacion').value.trim(),
      imagenUrl: document.getElementById('noticia-imagen').value.trim(),
      resumen: document.getElementById('noticia-resumen').value.trim(),
    };

    await fetch('/api/noticias/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    limpiarFormularioNoticia();
    mostrarNotificacion('Noticia guardada en SQL Server y publicada en la web.');
    cargarDatosDesdeSqlServer();
  });

  /* --------------------------------------------------------------------------
   * 6. ESTADÍSTICAS Y VACANTES (`EstadisticasInstitucionales` / `VacantesPorNivel`)
   * -------------------------------------------------------------------------- */
  const formEstadisticas = document.getElementById('form-estadisticas');

  const rellenarFormularioEstadisticas = () => {
    if (datosSql.estadisticas) {
      document.getElementById('est-anios').value = datosSql.estadisticas.AniosTrayectoria;
      document.getElementById('est-docentes').value = datosSql.estadisticas.TotalDocentes;
      document.getElementById('est-estudiantes').value = datosSql.estadisticas.TotalEstudiantes;
      document.getElementById('est-ambientes').value = datosSql.estadisticas.TotalAmbientes;
    }
    const vIni = datosSql.vacantes.find((v) => v.ClaveNivel === 'inicial');
    const vPri = datosSql.vacantes.find((v) => v.ClaveNivel === 'primaria');
    const vSec = datosSql.vacantes.find((v) => v.ClaveNivel === 'secundaria');

    if (vIni) document.getElementById('vac-inicial').value = vIni.VacantesDisponibles;
    if (vPri) document.getElementById('vac-primaria').value = vPri.VacantesDisponibles;
    if (vSec) document.getElementById('vac-secundaria').value = vSec.VacantesDisponibles;
  };

  formEstadisticas?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      aniosTrayectoria: parseInt(document.getElementById('est-anios').value, 10),
      totalDocentes: parseInt(document.getElementById('est-docentes').value, 10),
      totalEstudiantes: parseInt(document.getElementById('est-estudiantes').value, 10),
      totalAmbientes: parseInt(document.getElementById('est-ambientes').value, 10),
      vacantesInicial: parseInt(document.getElementById('vac-inicial').value, 10),
      vacantesPrimaria: parseInt(document.getElementById('vac-primaria').value, 10),
      vacantesSecundaria: parseInt(document.getElementById('vac-secundaria').value, 10),
    };

    await fetch('/api/estadisticas/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    mostrarNotificacion('Contadores y vacantes actualizados en SQL Server 2022.');
    cargarDatosDesdeSqlServer();
  });

  /* --------------------------------------------------------------------------
   * 7. COMUNICADOS OFICIALES (`dbo.ComunicadosOficiales`)
   * -------------------------------------------------------------------------- */
  const formComunicado = document.getElementById('form-comunicado');
  const listaComunicadosAdmin = document.getElementById('lista-comunicados-admin');

  const renderizarComunicadosAdmin = () => {
    if (!listaComunicadosAdmin) return;
    listaComunicadosAdmin.innerHTML = datosSql.comunicados
      .map(
        (c) => `
      <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ${c.DirigidoA}
          </span>
          <h4 class="font-extrabold text-faustiniano-900 text-sm mt-1.5">${c.Titulo}</h4>
          <p class="text-xs text-slate-600 mt-1">${c.Detalle}</p>
          <span class="text-[11px] text-slate-400 mt-1 block">Publicado: ${c.FechaEmision}</span>
        </div>
        <button type="button" data-eliminar-comunicado="${c.IdComunicado}" class="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-bold transition shrink-0">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`
      )
      .join('');

    listaComunicadosAdmin.querySelectorAll('[data-eliminar-comunicado]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idComunicado = parseInt(btn.getAttribute('data-eliminar-comunicado'), 10);
        await fetch('/api/comunicados/eliminar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idComunicado }),
        });
        mostrarNotificacion('Comunicado eliminado de SQL Server.');
        cargarDatosDesdeSqlServer();
      });
    });
  };

  formComunicado?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      titulo: document.getElementById('com-titulo').value.trim(),
      dirigidoA: document.getElementById('com-dirigido').value.trim(),
      detalle: document.getElementById('com-detalle').value.trim(),
    };

    await fetch('/api/comunicados/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    formComunicado.reset();
    mostrarNotificacion('Comunicado oficial publicado en SQL Server 2022.');
    cargarDatosDesdeSqlServer();
  });

  verificarSesionGuardada();
});
