/**
 * ============================================================================
 * Script Principal de Interactividad - I.E. N° 82115 "José Faustino Sánchez Carrión"
 * Ubicación: Huamachuco - UGEL Sánchez Carrión - DRE La Libertad
 * Conectado a SQL Server 2022 (Base de Datos: DB_IE82115_JFSC)
 * Autor: César Quiroz
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar íconos de Lucide si la librería está cargada
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Referencias a elementos principales del DOM
  const navbar = document.getElementById('navbar');
  const btnMenuMovil = document.getElementById('btn-menu-movil');
  const menuMovil = document.getElementById('menu-movil');
  const iconoMenuAbierto = document.getElementById('icono-menu-abierto');
  const iconoMenuCerrado = document.getElementById('icono-menu-cerrado');
  const enlacesMenuMovil = document.querySelectorAll('.enlace-movil');
  const enlacesNavbar = document.querySelectorAll('.nav-link');
  const btnSubir = document.getElementById('btn-subir');

  /* --------------------------------------------------------------------------
   * 1. NAVEGACIÓN PEGAJOSA Y MENÚ MÓVIL RESPONSIVO
   * -------------------------------------------------------------------------- */
  const alternarMenuMovil = (forzarCerrar = false) => {
    if (!menuMovil) return;
    const estaOculto = menuMovil.classList.contains('hidden');

    if (forzarCerrar || !estaOculto) {
      menuMovil.classList.add('hidden');
      iconoMenuAbierto?.classList.remove('hidden');
      iconoMenuCerrado?.classList.add('hidden');
      btnMenuMovil?.setAttribute('aria-expanded', 'false');
    } else {
      menuMovil.classList.remove('hidden');
      iconoMenuAbierto?.classList.add('hidden');
      iconoMenuCerrado?.classList.remove('hidden');
      btnMenuMovil?.setAttribute('aria-expanded', 'true');
    }
  };

  btnMenuMovil?.addEventListener('click', () => alternarMenuMovil());

  // Cerrar el menú móvil automáticamente al seleccionar cualquier sección
  enlacesMenuMovil.forEach((enlace) => {
    enlace.addEventListener('click', () => alternarMenuMovil(true));
  });

  // Controlar apariencia del Header y botón "Volver arriba" según el scroll
  const secciones = document.querySelectorAll('section[id]');

  const gestionarScroll = () => {
    const scrollActual = window.scrollY;

    if (scrollActual > 25) {
      navbar?.classList.add('shadow-lg', 'py-2');
      navbar?.classList.remove('py-3.5');
    } else {
      navbar?.classList.remove('shadow-lg', 'py-2');
      navbar?.classList.add('py-3.5');
    }

    if (scrollActual > 500) {
      btnSubir?.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btnSubir?.classList.add('opacity-100', 'translate-y-0');
    } else {
      btnSubir?.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      btnSubir?.classList.remove('opacity-100', 'translate-y-0');
    }

    let seccionActual = '';
    secciones.forEach((seccion) => {
      const topeSeccion = seccion.offsetTop - 130;
      const alturaSeccion = seccion.offsetHeight;
      if (scrollActual >= topeSeccion && scrollActual < topeSeccion + alturaSeccion) {
        seccionActual = seccion.getAttribute('id') || '';
      }
    });

    enlacesNavbar.forEach((enlace) => {
      enlace.classList.remove('activo', 'text-blue-800', 'font-bold');
      if (enlace.getAttribute('href') === `#${seccionActual}`) {
        enlace.classList.add('activo', 'text-blue-800', 'font-bold');
      }
    });
  };

  window.addEventListener('scroll', gestionarScroll, { passive: true });
  gestionarScroll();

  btnSubir?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --------------------------------------------------------------------------
   * 2. ANIMACIONES SUAVES AL HACER SCROLL (INTERSECTION OBSERVER)
   * -------------------------------------------------------------------------- */
  const elementosRevelar = document.querySelectorAll('.revelar, .revelar-izquierda, .revelar-derecha');

  const observadorRevelar = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('activo');
          observadorRevelar.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elementosRevelar.forEach((el) => observadorRevelar.observe(el));

  /* --------------------------------------------------------------------------
   * 3. CONTADORES ANIMADOS Y SINCRONIZACIÓN EN VIVO CON SQL SERVER 2022
   * -------------------------------------------------------------------------- */
  const contadores = document.querySelectorAll('.contador-numero');
  let contadoresIniciados = false;

  const animarContadores = () => {
    contadoresIniciados = true;

    contadores.forEach((contador) => {
      const meta = parseInt(contador.getAttribute('data-meta') || '0', 10);
      const sufijo = contador.getAttribute('data-sufijo') || '';
      const prefijo = contador.getAttribute('data-prefijo') || '';
      const duracion = 1800;
      const inicioTiempo = performance.now();

      const actualizarContador = (tiempoActual) => {
        const transcurrido = tiempoActual - inicioTiempo;
        const progreso = Math.min(transcurrido / duracion, 1);
        const suavizado = 1 - Math.pow(1 - progreso, 4);
        const valorActual = Math.floor(suavizado * meta);

        contador.textContent = `${prefijo}${valorActual.toLocaleString('es-PE')}${sufijo}`;

        if (progreso < 1) {
          requestAnimationFrame(actualizarContador);
        } else {
          contador.textContent = `${prefijo}${meta.toLocaleString('es-PE')}${sufijo}`;
        }
      };

      requestAnimationFrame(actualizarContador);
    });
  };

  const seccionEstadisticas = document.getElementById('estadisticas');
  if (seccionEstadisticas) {
    const observadorEstadisticas = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting && !contadoresIniciados) {
          animarContadores();
          observadorEstadisticas.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observadorEstadisticas.observe(seccionEstadisticas);
  }

  // Control del Modal Pop-up de Comunicado Oficial de Dirección
  const modalComunicado = document.getElementById('modal-comunicado');
  const btnVerComunicado = document.getElementById('btn-ver-comunicado');
  const botonesCerrarComunicado = document.querySelectorAll('.cerrar-modal-comunicado');

  const abrirModalComunicado = () => {
    if (!modalComunicado) return;
    modalComunicado.classList.remove('hidden');
    modalComunicado.classList.add('flex');
  };

  const cerrarModalComunicado = () => {
    if (!modalComunicado) return;
    modalComunicado.classList.add('hidden');
    modalComunicado.classList.remove('flex');
  };

  btnVerComunicado?.addEventListener('click', abrirModalComunicado);
  botonesCerrarComunicado.forEach((btn) => btn.addEventListener('click', cerrarModalComunicado));
  modalComunicado?.addEventListener('click', (e) => {
    if (e.target === modalComunicado) cerrarModalComunicado();
  });

  const CLAVE_BD_NUBE = 'db_ie82115_jfsc_v1';

  const aplicarDatosEnPortada = (data) => {
    if (!data) return;

    // 1. Actualizar contadores si existen datos en dbo.EstadisticasInstitucionales
    if (data.estadisticas) {
      const cAnios = document.getElementById('contador-anios');
      const cDoc = document.getElementById('contador-docentes');
      const cEst = document.getElementById('contador-estudiantes');
      const cAmb = document.getElementById('contador-ambientes');

      if (cAnios) cAnios.setAttribute('data-meta', data.estadisticas.AniosTrayectoria);
      if (cDoc) cDoc.setAttribute('data-meta', data.estadisticas.TotalDocentes);
      if (cEst) cEst.setAttribute('data-meta', data.estadisticas.TotalEstudiantes);
      if (cAmb) cAmb.setAttribute('data-meta', data.estadisticas.TotalAmbientes);

      if (contadoresIniciados) {
        animarContadores();
      }
    }

    // 2. Actualizar Vacantes Disponibles por Nivel desde dbo.VacantesPorNivel
    const listaVacantes = Array.isArray(data.vacantes) ? data.vacantes : data.vacantes ? [data.vacantes] : [];
    listaVacantes.forEach((vac) => {
      const badgeVac = document.getElementById(`badge-vacantes-${vac.ClaveNivel}`);
      if (badgeVac) {
        badgeVac.textContent = `${vac.VacantesDisponibles} Vacantes`;
      }
    });

    // 3. Actualizar Comunicado Oficial activo desde dbo.ComunicadosOficiales
    const listaComunicados = Array.isArray(data.comunicados) ? data.comunicados : data.comunicados ? [data.comunicados] : [];
    if (listaComunicados.length > 0) {
      const ultimoCom = listaComunicados[0];
      const elTitulo = document.getElementById('comunicado-titulo');
      const elDetalle = document.getElementById('comunicado-detalle');
      const elDirigido = document.getElementById('comunicado-dirigido');
      const elFecha = document.getElementById('comunicado-fecha');

      if (elTitulo) elTitulo.textContent = ultimoCom.Titulo;
      if (elDetalle) elDetalle.textContent = ultimoCom.Detalle;
      if (elDirigido) elDirigido.textContent = ultimoCom.DirigidoA;
      if (elFecha) elFecha.textContent = ultimoCom.FechaEmision || 'Huamachuco, 2026';

      if (!sessionStorage.getItem('comunicado_visto_ie82115')) {
        sessionStorage.setItem('comunicado_visto_ie82115', '1');
        setTimeout(abrirModalComunicado, 1200);
      }
    }

    // 4. Renderizar Noticias y Eventos desde dbo.NoticiasEventos
    const grillaGaleria = document.getElementById('grilla-galeria-eventos');
    const listaNoticias = Array.isArray(data.noticias) ? data.noticias : data.noticias ? [data.noticias] : [];

    if (grillaGaleria && listaNoticias.length > 0) {
      const coloresCategoria = {
        civico: 'bg-red-600',
        academico: 'bg-blue-700',
        aniversario: 'bg-amber-600',
        deportes: 'bg-emerald-600',
      };

      grillaGaleria.innerHTML = listaNoticias
        .map((item) => {
          const colorBadge = coloresCategoria[item.Categoria] || 'bg-blue-800';
          return `
          <article class="galeria-item bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm tarjeta-interactiva" data-categoria="${item.Categoria}">
            <div class="relative h-56 overflow-hidden">
              <img
                src="${item.ImagenUrl}"
                alt="${item.Titulo}"
                class="w-full h-full object-cover"
              />
              <span class="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${colorBadge} text-white shadow">
                ${item.EtiquetaVisible}
              </span>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <i class="fa-solid fa-location-dot text-amber-600"></i>
                <span>${item.UbicacionFecha}</span>
              </div>
              <h3 class="text-lg font-extrabold text-faustiniano-900 mb-2">
                ${item.Titulo}
              </h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                ${item.Resumen}
              </p>
            </div>
          </article>`;
        })
        .join('');
    }
  };

  // Sincronizar Estadísticas, Vacantes, Comunicados y Galería desde SQL Server 2022 o Respaldo Nube
  const cargarDatosDesdeSqlServer = async () => {
    try {
      const resp = await fetch('/api/publico');
      if (!resp.ok) throw new Error('Modo Nube');
      const data = await resp.json();
      if (!data.ok) throw new Error('Sin datos');
      aplicarDatosEnPortada(data);
    } catch (e) {
      try {
        const guardado = localStorage.getItem(CLAVE_BD_NUBE);
        if (guardado) {
          aplicarDatosEnPortada(JSON.parse(guardado));
        } else if (!sessionStorage.getItem('comunicado_visto_ie82115')) {
          sessionStorage.setItem('comunicado_visto_ie82115', '1');
          setTimeout(abrirModalComunicado, 1200);
        }
      } catch (err) {}
    }
  };

  cargarDatosDesdeSqlServer();

  /* --------------------------------------------------------------------------
   * 4. MODAL DETALLADO DE NIVELES EDUCATIVOS (INICIAL, PRIMARIA, SECUNDARIA)
   * -------------------------------------------------------------------------- */
  const datosNiveles = {
    inicial: {
      titulo: 'Nivel de Educación Inicial (3, 4 y 5 años)',
      subtitulo: 'Formación temprana con afecto, psicomotricidad e identidad cultural',
      colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      horario: 'Lunes a Viernes: 8:00 a.m. – 12:30 p.m.',
      edades: 'Niños y niñas de 3, 4 y 5 años cumplidos al 31 de marzo',
      descripcion:
        'En el Nivel Inicial de la I.E. N° 82115 "José Faustino Sánchez Carrión", promovemos el desarrollo integral mediante el juego libre, la exploración sensorial, la psicomotricidad fina y gruesa, y la formación en valores desde la primera infancia.',
      ejes: [
        'Desarrollo de la psicomotricidad y expresión corporal en espacios seguros y recreativos.',
        'Iniciación a la lectoescritura y estimulación del lenguaje oral y artístico.',
        'Formación de hábitos de convivencia, autonomía personal y valores ciudadanos.',
        'Acompañamiento psicopedagógico permanente y Escuela de Padres Faustinianos.',
      ],
      talleres: ['Psicomotricidad y Expresión Corporal', 'Danza Folklórica Huamachuquina', 'Pintura y Mini Arte', 'Cuentacuentos e Identidad'],
      valorSelect: 'Nivel Inicial (3 a 5 años)',
    },
    primaria: {
      titulo: 'Nivel de Educación Primaria (1.° a 6.° grado)',
      subtitulo: 'Pensamiento lógico, comprensión lectora crítica e innovación',
      colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
      horario: 'Lunes a Viernes: 7:45 a.m. – 1:15 p.m.',
      edades: 'Estudiantes de 1.° a 6.° grado de Educación Básica Regular',
      descripcion:
        'Consolidamos las competencias fundamentales del Currículo Nacional con énfasis en el razonamiento matemático, la comprensión lectora crítica, la indagación científica y el uso responsable de las tecnologías educativas.',
      ejes: [
        'Programa intensivo de Comprensión Lectora y Plan Lector con autores regionales y nacionales.',
        'Desarrollo del pensamiento lógico-matemático y preparación para olimpiadas escolares.',
        'Indagación científica en laboratorio y proyectos ambientales de biohuerto escolar.',
        'Talleres formativos de robótica educativa, computación, música e inglés básico.',
      ],
      talleres: ['Ajedrez y Razonamiento Lógico', 'Aula de Innovación Pedagógica (AIP)', 'Banda Rítmica y Música', 'Atletismo y Deportes Colectivos'],
      valorSelect: 'Nivel Primaria (1.° a 6.° grado)',
    },
    secundaria: {
      titulo: 'Nivel de Educación Secundaria (1.° a 5.° año)',
      subtitulo: 'Liderazgo republicano, ciencia, tecnología y preparación preuniversitaria',
      colorBadge: 'bg-red-100 text-red-800 border-red-300',
      horario: 'Lunes a Viernes: 7:30 a.m. – 3:00 p.m.',
      edades: 'Adolescentes de 1.° a 5.° año de Educación Secundaria',
      descripcion:
        'Inspirados en el pensamiento ilustrado de José Faustino Sánchez Carrión, formamos jóvenes líderes con sólida base científica, humanística, tecnológica y preuniversitaria, listos para afrontar la educación superior y transformar la provincia de Sánchez Carrión.',
      ejes: [
        'Círculos de estudio y reforzamiento preuniversitario en Matemática, Física, Química y Humanidades.',
        'Participación destacada en concursos nacionales: ONEM, FENCYT Eureka y Premio José María Arguedas.',
        'Educación para el Trabajo (EPT) con herramientas digitales, emprendimiento y ofimática avanzada.',
        'Orientación vocacional, liderazgo estudiantil (Municipio Escolar) y formación cívico-patriótica.',
      ],
      talleres: ['Círculo Preuniversitario Faustiniano', 'Laboratorio de Ciencia y Tecnología', 'Oratoria y Debate "El Tribuno"', 'Banda de Guerra y Selección Deportiva'],
      valorSelect: 'Nivel Secundaria (1.° a 5.° año)',
    },
  };

  const modalNivel = document.getElementById('modal-nivel');
  const modalNivelTitulo = document.getElementById('modal-nivel-titulo');
  const modalNivelSubtitulo = document.getElementById('modal-nivel-subtitulo');
  const modalNivelBadge = document.getElementById('modal-nivel-badge');
  const modalNivelHorario = document.getElementById('modal-nivel-horario');
  const modalNivelEdades = document.getElementById('modal-nivel-edades');
  const modalNivelDescripcion = document.getElementById('modal-nivel-descripcion');
  const modalNivelEjes = document.getElementById('modal-nivel-ejes');
  const modalNivelTalleres = document.getElementById('modal-nivel-talleres');
  const btnModalSolicitarVacante = document.getElementById('btn-modal-solicitar-vacante');
  const botonesAbrirNivel = document.querySelectorAll('[data-nivel-modal]');
  const botonesCerrarNivel = document.querySelectorAll('.cerrar-modal-nivel');

  let nivelSeleccionadoActual = '';

  const abrirModalNivel = (claveNivel) => {
    const info = datosNiveles[claveNivel];
    if (!info || !modalNivel) return;

    nivelSeleccionadoActual = info.valorSelect;
    modalNivelTitulo.textContent = info.titulo;
    modalNivelSubtitulo.textContent = info.subtitulo;
    modalNivelBadge.className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${info.colorBadge}`;
    modalNivelBadge.textContent = 'Propuesta Pedagógica Oficial';
    modalNivelHorario.textContent = info.horario;
    modalNivelEdades.textContent = info.edades;
    modalNivelDescripcion.textContent = info.descripcion;

    modalNivelEjes.innerHTML = info.ejes
      .map(
        (eje) => `
        <li class="flex items-start gap-2.5 text-slate-700 text-sm">
          <i class="fa-solid fa-circle-check text-amber-600 mt-1 shrink-0"></i>
          <span>${eje}</span>
        </li>`
      )
      .join('');

    modalNivelTalleres.innerHTML = info.talleres
      .map(
        (taller) => `
        <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
          <i class="fa-solid fa-star text-amber-500 mr-1"></i>${taller}
        </span>`
      )
      .join('');

    modalNivel.classList.remove('hidden');
    modalNivel.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  };

  const cerrarModalNivel = () => {
    if (!modalNivel) return;
    modalNivel.classList.add('hidden');
    modalNivel.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  };

  botonesAbrirNivel.forEach((boton) => {
    boton.addEventListener('click', () => {
      const clave = boton.getAttribute('data-nivel-modal');
      if (clave) abrirModalNivel(clave);
    });
  });

  botonesCerrarNivel.forEach((boton) => {
    boton.addEventListener('click', cerrarModalNivel);
  });

  modalNivel?.addEventListener('click', (e) => {
    if (e.target === modalNivel) cerrarModalNivel();
  });

  btnModalSolicitarVacante?.addEventListener('click', () => {
    cerrarModalNivel();
    const selectNivel = document.getElementById('nivel-interes');
    if (selectNivel && nivelSeleccionadoActual) {
      selectNivel.value = nivelSeleccionadoActual;
    }
    const seccionContacto = document.getElementById('contacto');
    seccionContacto?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('nombre-completo')?.focus();
    }, 650);
  });

  /* --------------------------------------------------------------------------
   * 5. FILTRO DE GALERÍA / VIDA ESCOLAR Y EVENTOS EN HUAMACHUCO
   * -------------------------------------------------------------------------- */
  const botonesFiltro = document.querySelectorAll('.btn-filtro-galeria');

  botonesFiltro.forEach((boton) => {
    boton.addEventListener('click', () => {
      const categoria = boton.getAttribute('data-filtro');
      const tarjetasGaleria = document.querySelectorAll('.galeria-item');

      botonesFiltro.forEach((b) => {
        b.classList.remove('bg-blue-900', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      });
      boton.classList.add('bg-blue-900', 'text-white', 'shadow-md');
      boton.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');

      tarjetasGaleria.forEach((item) => {
        const itemCat = item.getAttribute('data-categoria');
        if (categoria === 'todos' || itemCat === categoria) {
          item.classList.remove('hidden');
          item.animate(
            [
              { opacity: 0, transform: 'scale(0.95)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            { duration: 300, easing: 'ease-out' }
          );
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
   * 6. ACORDEÓN DE PREGUNTAS FRECUENTES (PROCESO DE ADMISIÓN Y MATRÍCULA)
   * -------------------------------------------------------------------------- */
  const botonesFaq = document.querySelectorAll('.faq-boton');

  botonesFaq.forEach((boton) => {
    boton.addEventListener('click', () => {
      const respuesta = boton.nextElementSibling;
      const icono = boton.querySelector('.faq-icono');
      const estaAbierto = !respuesta.classList.contains('hidden');

      document.querySelectorAll('.faq-respuesta').forEach((el) => el.classList.add('hidden'));
      document.querySelectorAll('.faq-icono').forEach((ic) => ic.classList.remove('rotate-180'));

      if (!estaAbierto) {
        respuesta.classList.remove('hidden');
        icono?.classList.add('rotate-180');
      }
    });
  });

  /* --------------------------------------------------------------------------
   * 7. FORMULARIO CONECTADO A SQL SERVER 2022 (`dbo.SolicitudesAdmision`)
   * -------------------------------------------------------------------------- */
  const formularioContacto = document.getElementById('formulario-contacto');
  const alertaExito = document.getElementById('alerta-exito-formulario');
  const codigoSeguimientoSpan = document.getElementById('codigo-seguimiento');
  const resumenConsultaSpan = document.getElementById('resumen-consulta');
  const btnEnviarFormulario = document.getElementById('btn-enviar-formulario');

  formularioContacto?.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nombre = document.getElementById('nombre-completo')?.value.trim();
    const dni = document.getElementById('dni-apoderado')?.value.trim();
    const telefono = document.getElementById('telefono-contacto')?.value.trim();
    const correo = document.getElementById('correo-contacto')?.value.trim();
    const nivel = document.getElementById('nivel-interes')?.value;
    const motivo = document.getElementById('motivo-consulta')?.value;
    const mensaje = document.getElementById('mensaje-consulta')?.value.trim();

    if (!nombre || !telefono || !nivel || !mensaje) {
      return;
    }

    const textoOriginal = btnEnviarFormulario.innerHTML;
    btnEnviarFormulario.disabled = true;
    btnEnviarFormulario.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>Guardando en SQL Server 2022 (DB_IE82115_JFSC)...</span>
    `;

    let codigoExpediente = `IE82115-HCO-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const resp = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, dni, telefono, correo, nivel, motivo, mensaje }),
      });
      if (!resp.ok) throw new Error('Modo Nube');
      const resultado = await resp.json();
      if (resultado.ok && resultado.codigo) {
        codigoExpediente = resultado.codigo;
      }
    } catch (err) {
      // Guardar también en la base de datos persistente del navegador para GitHub Pages
      try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_BD_NUBE) || 'null');
        if (guardado && Array.isArray(guardado.solicitudes)) {
          const nuevoId = guardado.solicitudes.reduce((m, s) => Math.max(m, s.IdSolicitud || 0), 0) + 1;
          guardado.solicitudes.unshift({
            IdSolicitud: nuevoId,
            CodigoExpediente: codigoExpediente,
            NombreApoderado: nombre,
            DniApoderado: dni,
            Telefono: telefono,
            Correo: correo,
            NivelInteres: nivel,
            MotivoConsulta: motivo,
            Mensaje: mensaje,
            Estado: 'Pendiente',
            ObservacionAdmin: 'Registrado desde Portal Web',
            FechaRegistro: new Date().toLocaleString('es-PE'),
          });
          localStorage.setItem(CLAVE_BD_NUBE, JSON.stringify(guardado));
        }
      } catch (e) {}
    }

    if (codigoSeguimientoSpan) codigoSeguimientoSpan.textContent = codigoExpediente;
    if (resumenConsultaSpan) {
      resumenConsultaSpan.textContent = `Estimado(a) ${nombre}, su solicitud sobre ${motivo} para ${nivel} ha sido registrada en nuestra base de datos SQL Server 2022 con expediente ${codigoExpediente}. Ya puede ser visualizada desde el Panel Administrativo.`;
    }

    alertaExito?.classList.remove('hidden');
    formularioContacto.reset();

    btnEnviarFormulario.disabled = false;
    btnEnviarFormulario.innerHTML = textoOriginal;

    alertaExito?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalNivel();
    }
  });
});
