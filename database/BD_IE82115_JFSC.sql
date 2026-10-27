/* ============================================================================
   SCRIPT DE BASE DE DATOS SQL SERVER 2022
   Sistema Web Institucional y Panel Administrativo
   Institución: I.E. N° 82115 "José Faustino Sánchez Carrión" - Huamachuco
   UGEL Sánchez Carrión - DRE La Libertad
   Autor: César Quiroz
   ============================================================================ */

-- 1. Crear la Base de Datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DB_IE82115_JFSC')
BEGIN
    CREATE DATABASE [DB_IE82115_JFSC];
END
GO

USE [DB_IE82115_JFSC];
GO

-- ============================================================================
-- TABLA 1: UsuariosAdministradores (Acceso al Panel Administrativo)
-- ============================================================================
IF OBJECT_ID(N'dbo.UsuariosAdministradores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuariosAdministradores (
        IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
        Usuario NVARCHAR(50) NOT NULL UNIQUE,
        ClaveAcceso NVARCHAR(100) NOT NULL,
        NombreCompleto NVARCHAR(120) NOT NULL,
        Cargo NVARCHAR(80) NOT NULL,
        Rol NVARCHAR(40) NOT NULL DEFAULT 'Administrador',
        Activo BIT NOT NULL DEFAULT 1,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Insertar usuarios iniciales del sistema
    INSERT INTO dbo.UsuariosAdministradores (Usuario, ClaveAcceso, NombreCompleto, Cargo, Rol)
    VALUES
        (N'admin', N'faustiniano2026', N'Dirección General I.E. 82115', N'Director(a) Institucional', N'SuperAdmin'),
        (N'secretaria', N'huamachuco2026', N'Mesa de Partes y SIAGIE', N'Secretaría Académica', N'Secretaría');
END
GO

-- ============================================================================
-- TABLA 2: EstadisticasInstitucionales (Contadores dinámicos de la portada)
-- ============================================================================
IF OBJECT_ID(N'dbo.EstadisticasInstitucionales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EstadisticasInstitucionales (
        IdEstadistica INT PRIMARY KEY,
        AniosTrayectoria INT NOT NULL,
        TotalDocentes INT NOT NULL,
        TotalEstudiantes INT NOT NULL,
        TotalAmbientes INT NOT NULL,
        AnioEscolar NVARCHAR(20) NOT NULL,
        MatriculaAbierta BIT NOT NULL DEFAULT 1,
        UltimaActualizacion DATETIME NOT NULL DEFAULT GETDATE()
    );

    INSERT INTO dbo.EstadisticasInstitucionales
        (IdEstadistica, AniosTrayectoria, TotalDocentes, TotalEstudiantes, TotalAmbientes, AnioEscolar, MatriculaAbierta)
    VALUES
        (1, 60, 65, 1250, 38, N'2026', 1);
END
GO

-- ============================================================================
-- TABLA 3: SolicitudesAdmision (Mesa de Partes Virtual, Matrícula e Informes)
-- ============================================================================
IF OBJECT_ID(N'dbo.SolicitudesAdmision', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SolicitudesAdmision (
        IdSolicitud INT IDENTITY(1,1) PRIMARY KEY,
        CodigoExpediente NVARCHAR(30) NOT NULL UNIQUE,
        NombreApoderado NVARCHAR(150) NOT NULL,
        DniApoderado NVARCHAR(15) NOT NULL,
        Telefono NVARCHAR(30) NOT NULL,
        Correo NVARCHAR(120) NULL,
        NivelInteres NVARCHAR(80) NOT NULL,
        MotivoConsulta NVARCHAR(100) NOT NULL,
        Mensaje NVARCHAR(MAX) NOT NULL,
        Estado NVARCHAR(30) NOT NULL DEFAULT N'Pendiente', -- Pendiente, En Revisión, Atendido
        ObservacionAdmin NVARCHAR(500) NULL,
        FechaRegistro DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Datos de ejemplo iniciales en Huamachuco
    INSERT INTO dbo.SolicitudesAdmision
        (CodigoExpediente, NombreApoderado, DniApoderado, Telefono, Correo, NivelInteres, MotivoConsulta, Mensaje, Estado, ObservacionAdmin)
    VALUES
        (N'IE82115-HCO-1042', N'María Elena Paredes Ríos', N'45892310', N'948512340', N'mparedes@gmail.com', N'Nivel Inicial (3 a 5 años)', N'Vacante y Matrícula Nueva', N'Solicito información sobre vacantes disponibles para aula de 4 años en el turno mañana.', N'Pendiente', N'Por contactar vía WhatsApp'),
        (N'IE82115-HCO-1089', N'Carlos Alberto Rebaza Cuba', N'41257896', N'949876123', N'crebaza@hotmail.com', N'Nivel Primaria (1.° a 6.° grado)', N'Traslado de Matrícula', N'Deseo trasladar a mi menor hijo al 3.° grado de primaria desde otra institución de la provincia.', N'En Revisión', N'Validando código modular en SIAGIE'),
        (N'IE82115-HCO-1105', N'Rosa Angélica Otiniano Vera', N'43981205', N'944321789', N'rosa.otiniano@gmail.com', N'Nivel Secundaria (1.° a 5.° año)', N'Vacante y Matrícula Nueva', N'Consulta de requisitos para ingreso a 1.° año de educación secundaria 2026.', N'Atendido', N'Se brindó orientación presencial en Av. 10 de Julio 281');
END
GO

-- ============================================================================
-- TABLA 4: NoticiasEventos (Galería, Vida Escolar y Actividades en Huamachuco)
-- ============================================================================
IF OBJECT_ID(N'dbo.NoticiasEventos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NoticiasEventos (
        IdNoticia INT IDENTITY(1,1) PRIMARY KEY,
        Titulo NVARCHAR(200) NOT NULL,
        Categoria NVARCHAR(40) NOT NULL, -- civico, academico, aniversario, deportes
        EtiquetaVisible NVARCHAR(60) NOT NULL,
        UbicacionFecha NVARCHAR(120) NOT NULL,
        Resumen NVARCHAR(600) NOT NULL,
        ImagenUrl NVARCHAR(500) NOT NULL,
        Destacado BIT NOT NULL DEFAULT 1,
        FechaPublicacion DATETIME NOT NULL DEFAULT GETDATE()
    );

    INSERT INTO dbo.NoticiasEventos
        (Titulo, Categoria, EtiquetaVisible, UbicacionFecha, Resumen, ImagenUrl, Destacado)
    VALUES
        (N'Gallardía en el Desfile Cívico Patriótico y Homenaje al Tribuno', N'civico', N'Actividad Cívica', N'Plaza de Armas de Huamachuco', N'Nuestra escolta, Estado Mayor y Banda de Guerra destacaron con paso marcial en las celebraciones cívicas de la provincia de Sánchez Carrión.', N'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80', 1),
        (N'Destacada participación en la Feria de Ciencias Eureka y ONEM', N'academico', N'Logro Académico', N'UGEL Sánchez Carrión • ONEM y Eureka', N'Delegaciones de Primaria y Secundaria presentaron proyectos de sostenibilidad ambiental e indagación científica representándonos a nivel provincial.', N'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', 1),
        (N'Verbena Artística, Concurso de Poesía y Reencuentro de Exalumnos', N'aniversario', N'Aniversario Institucional', N'Semana Jubilar Faustiniana', N'Con danzas tradicionales como la Contradanza de Huamachuco, antorchas y velada cultural, celebramos un año más de vida institucional.', N'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80', 1),
        (N'Campeones en los Juegos Escolares y Olimpiadas Internas', N'deportes', N'Deporte Escolar', N'Juegos Escolares Deportivos', N'Nuestras selecciones de fútbol, vóley, futsal y atletismo demostraron disciplina, trabajo en equipo y juego limpio en cada jornada.', N'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80', 1),
        (N'Festival de Lectura y Concurso de Oratoria Faustiniana', N'academico', N'Humanidades y Lectura', N'Concurso de Oratoria "El Tribuno"', N'Estudiantes de los tres niveles expresaron su talento literario y capacidad argumentativa inspirados en las cartas del Solitario de Sayán.', N'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80', 1),
        (N'Festidanza Escolar: Revalorando nuestras tradiciones andinas', N'civico', N'Identidad Cultural', N'Patrimonio de Sánchez Carrión', N'Integración de padres de familia, docentes y alumnos difundiendo el folklore de Huamachuco, Marcahuamachuco y Wiracochapampa.', N'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80', 1);
END
GO

-- ============================================================================
-- TABLA 5: VacantesPorNivel (Control de vacantes disponibles por nivel)
-- ============================================================================
IF OBJECT_ID(N'dbo.VacantesPorNivel', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VacantesPorNivel (
        IdNivel INT PRIMARY KEY,
        ClaveNivel NVARCHAR(30) NOT NULL UNIQUE,
        NombreNivel NVARCHAR(80) NOT NULL,
        CicloGrados NVARCHAR(80) NOT NULL,
        Horario NVARCHAR(80) NOT NULL,
        VacantesDisponibles INT NOT NULL,
        EstadoVacantes NVARCHAR(40) NOT NULL DEFAULT N'Abiertas'
    );

    INSERT INTO dbo.VacantesPorNivel
        (IdNivel, ClaveNivel, NombreNivel, CicloGrados, Horario, VacantesDisponibles, EstadoVacantes)
    VALUES
        (1, N'inicial', N'Nivel Inicial', N'3, 4 y 5 Años (II Ciclo)', N'8:00 a.m. - 12:30 p.m.', 35, N'Vacantes Disponibles'),
        (2, N'primaria', N'Nivel Primaria', N'1.° a 6.° Grado (III, IV y V Ciclo)', N'7:45 a.m. - 1:15 p.m.', 48, N'Vacantes Disponibles'),
        (3, N'secundaria', N'Nivel Secundaria', N'1.° a 5.° Año (VI y VII Ciclo)', N'7:30 a.m. - 3:00 p.m.', 42, N'Vacantes Disponibles');
END
GO

-- ============================================================================
-- TABLA 6: ComunicadosOficiales (Avisos urgentes y comunicados de Dirección)
-- ============================================================================
IF OBJECT_ID(N'dbo.ComunicadosOficiales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ComunicadosOficiales (
        IdComunicado INT IDENTITY(1,1) PRIMARY KEY,
        Titulo NVARCHAR(180) NOT NULL,
        Detalle NVARCHAR(600) NOT NULL,
        DirigidoA NVARCHAR(60) NOT NULL DEFAULT N'Toda la Comunidad Educativa',
        Activo BIT NOT NULL DEFAULT 1,
        FechaEmision DATETIME NOT NULL DEFAULT GETDATE()
    );

    INSERT INTO dbo.ComunicadosOficiales (Titulo, Detalle, DirigidoA, Activo)
    VALUES
        (N'Proceso de Matrícula y Ratificación 2026', N'Se comunica a los padres de familia que la atención presencial en Secretaría (Av. 10 de Julio 281 - Huamachuco) se realiza de lunes a viernes de 7:30 a.m. a 3:30 p.m.', N'Padres de Familia', 1);
END
GO
