<#
==============================================================================
Servidor Backend HTTP + API REST conectado a SQL Server 2022 (DB_IE82115_JFSC)
Institución: I.E. N° 82115 "José Faustino Sánchez Carrión" - Huamachuco
UGEL Sánchez Carrión - DRE La Libertad
Autor: César Quiroz
==============================================================================
#>

$ErrorActionPreference = "Continue"
$puerto = 8080
$raizProyecto = "c:\Users\ASUS\Documents\pagina informativa"

# Cadenas de conexión a SQL Server 2022 (Instancia principal e instancia SQLEXPRESS)
$cadenaPrincipal = "Server=localhost;Database=DB_IE82115_JFSC;Integrated Security=True;TrustServerCertificate=True;"
$cadenaExpress   = "Server=localhost\SQLEXPRESS;Database=DB_IE82115_JFSC;Integrated Security=True;TrustServerCertificate=True;"

# Función para consultar datos (SELECT) desde SQL Server 2022 y devolver arreglo de objetos
function Consultar-Sql {
    param(
        [string]$consulta,
        [hashtable]$parametros = @{}
    )
    $conexion = New-Object System.Data.SqlClient.SqlConnection($cadenaPrincipal)
    $comando = $conexion.CreateCommand()
    $comando.CommandText = $consulta

    foreach ($clave in $parametros.Keys) {
        $valor = if ($null -eq $parametros[$clave]) { [DBNull]::Value } else { $parametros[$clave] }
        [void]$comando.Parameters.AddWithValue($clave, $valor)
    }

    $adaptador = New-Object System.Data.SqlClient.SqlDataAdapter($comando)
    $tabla = New-Object System.Data.DataTable
    [void]$adaptador.Fill($tabla)
    $conexion.Close()

    $lista = @()
    foreach ($fila in $tabla.Rows) {
        $obj = [ordered]@{}
        foreach ($col in $tabla.Columns) {
            $val = $fila[$col.ColumnName]
            if ($val -is [DBNull]) {
                $obj[$col.ColumnName] = ""
            } elseif ($val -is [DateTime]) {
                $obj[$col.ColumnName] = $val.ToString("dd/MM/yyyy HH:mm")
            } else {
                $obj[$col.ColumnName] = $val
            }
        }
        $lista += [pscustomobject]$obj
    }
    return ,$lista
}

# Función para ejecutar INSERT, UPDATE o DELETE en SQL Server 2022 (sincroniza ambas instancias locales)
function Ejecutar-Sql {
    param(
        [string]$consulta,
        [hashtable]$parametros = @{}
    )
    foreach ($cadena in @($cadenaPrincipal, $cadenaExpress)) {
        try {
            $conexion = New-Object System.Data.SqlClient.SqlConnection($cadena)
            $conexion.Open()
            $comando = $conexion.CreateCommand()
            $comando.CommandText = $consulta
            foreach ($clave in $parametros.Keys) {
                $valor = if ($null -eq $parametros[$clave]) { [DBNull]::Value } else { $parametros[$clave] }
                [void]$comando.Parameters.AddWithValue($clave, $valor)
            }
            [void]$comando.ExecuteNonQuery()
            $conexion.Close()
        } catch {
            Write-Output "Aviso SQL: $($_.Exception.Message)"
        }
    }
}

# Función auxiliar para leer el cuerpo JSON enviado por el navegador
function Leer-CuerpoJson {
    param($request)
    $lector = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
    $texto = $lector.ReadToEnd()
    $lector.Close()
    if ([string]::IsNullOrWhiteSpace($texto)) { return $null }
    return ($texto | ConvertFrom-Json)
}

# Función auxiliar para enviar respuesta JSON en UTF-8
function Responder-Json {
    param($response, $objeto, [int]$codigo = 200)
    $json = $objeto | ConvertTo-Json -Depth 8 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.StatusCode = $codigo
    $response.ContentType = "application/json; charset=utf-8"
    $response.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate")
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

# Diccionario de tipos MIME para archivos estáticos
$tiposMime = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico"  = "image/x-icon"
    ".sql"  = "text/plain; charset=utf-8"
}

# Iniciar HttpListener en el puerto 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$puerto/")
$listener.Start()
Write-Output "===================================================================="
Write-Output "Servidor Web + API SQL Server 2022 activo en http://localhost:$puerto/"
Write-Output "Base de datos conectada: DB_IE82115_JFSC"
Write-Output "Autor: César Quiroz"
Write-Output "===================================================================="

while ($listener.IsListening) {
    $contexto = $listener.GetContext()
    $req = $contexto.Request
    $res = $contexto.Response
    $ruta = $req.Url.LocalPath
    $metodo = $req.HttpMethod

    try {
        # --------------------------------------------------------------------
        # ENDPOINT 1: Datos públicos para index.html desde SQL Server 2022
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/publico" -and $metodo -eq "GET") {
            $est = Consultar-Sql "SELECT TOP 1 * FROM dbo.EstadisticasInstitucionales WHERE IdEstadistica = 1"
            $not = Consultar-Sql "SELECT * FROM dbo.NoticiasEventos ORDER BY IdNoticia DESC"
            $vac = Consultar-Sql "SELECT * FROM dbo.VacantesPorNivel ORDER BY IdNivel ASC"
            $com = Consultar-Sql "SELECT * FROM dbo.ComunicadosOficiales WHERE Activo = 1 ORDER BY IdComunicado DESC"

            Responder-Json $res @{
                ok = $true
                estadisticas = if ($est.Count -gt 0) { $est[0] } else { $null }
                noticias = $not
                vacantes = $vac
                comunicados = $com
            }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 2: Inicio de sesión del Panel Administrativo
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/login" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $usuarios = Consultar-Sql "SELECT IdUsuario, Usuario, NombreCompleto, Cargo, Rol FROM dbo.UsuariosAdministradores WHERE Usuario = @u AND ClaveAcceso = @c AND Activo = 1" @{
                "@u" = [string]$datos.usuario
                "@c" = [string]$datos.clave
            }

            if ($usuarios.Count -gt 0) {
                Responder-Json $res @{
                    ok = $true
                    mensaje = "Bienvenido al Panel Administrativo de la I.E. N° 82115"
                    usuario = $usuarios[0]
                }
            } else {
                Responder-Json $res @{
                    ok = $false
                    mensaje = "Usuario o contraseña incorrectos. Verifique sus credenciales."
                } 401
            }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 3: Resumen completo para el Panel Administrativo (admin.html)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/admin/datos" -and $metodo -eq "GET") {
            $est = Consultar-Sql "SELECT TOP 1 * FROM dbo.EstadisticasInstitucionales WHERE IdEstadistica = 1"
            $sol = Consultar-Sql "SELECT * FROM dbo.SolicitudesAdmision ORDER BY IdSolicitud DESC"
            $not = Consultar-Sql "SELECT * FROM dbo.NoticiasEventos ORDER BY IdNoticia DESC"
            $vac = Consultar-Sql "SELECT * FROM dbo.VacantesPorNivel ORDER BY IdNivel ASC"
            $com = Consultar-Sql "SELECT * FROM dbo.ComunicadosOficiales ORDER BY IdComunicado DESC"

            Responder-Json $res @{
                ok = $true
                servidorSql = "DESKTOP-663F05F (SQL Server 2022)"
                baseDatos = "DB_IE82115_JFSC"
                estadisticas = if ($est.Count -gt 0) { $est[0] } else { $null }
                solicitudes = $sol
                noticias = $not
                vacantes = $vac
                comunicados = $com
            }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 4: Registrar nueva Solicitud de Matrícula / Informes (INSERT)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/solicitudes" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $aleatorio = Get-Random -Minimum 1200 -Maximum 9999
            $codigo = "IE82115-HCO-$aleatorio"

            $sqlInsert = @"
INSERT INTO dbo.SolicitudesAdmision
(CodigoExpediente, NombreApoderado, DniApoderado, Telefono, Correo, NivelInteres, MotivoConsulta, Mensaje, Estado, ObservacionAdmin)
VALUES
(@cod, @nom, @dni, @tel, @cor, @niv, @mot, @msj, N'Pendiente', N'Registrado desde el Portal Web Institucional');
"@
            Ejecutar-Sql $sqlInsert @{
                "@cod" = $codigo
                "@nom" = [string]$datos.nombre
                "@dni" = [string]$datos.dni
                "@tel" = [string]$datos.telefono
                "@cor" = [string]$datos.correo
                "@niv" = [string]$datos.nivel
                "@mot" = [string]$datos.motivo
                "@msj" = [string]$datos.mensaje
            }

            Responder-Json $res @{
                ok = $true
                codigo = $codigo
                mensaje = "Solicitud guardada exitosamente en SQL Server 2022 (DB_IE82115_JFSC)"
            }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 5: Actualizar Estado de una Solicitud (UPDATE)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/solicitudes/estado" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $sqlUpdate = "UPDATE dbo.SolicitudesAdmision SET Estado = @est, ObservacionAdmin = @obs WHERE IdSolicitud = @id"
            Ejecutar-Sql $sqlUpdate @{
                "@est" = [string]$datos.estado
                "@obs" = [string]$datos.observacion
                "@id"  = [int]$datos.idSolicitud
            }
            Responder-Json $res @{ ok = $true; mensaje = "Estado de solicitud actualizado en SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 6: Eliminar una Solicitud (DELETE)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/solicitudes/eliminar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            Ejecutar-Sql "DELETE FROM dbo.SolicitudesAdmision WHERE IdSolicitud = @id" @{
                "@id" = [int]$datos.idSolicitud
            }
            Responder-Json $res @{ ok = $true; mensaje = "Solicitud eliminada de SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 6.5: Subir imagen desde el dispositivo a la carpeta img/eventos/
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/subir-imagen" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $carpetaEventos = Join-Path $raizProyecto "img\eventos"
            if (-not (Test-Path $carpetaEventos)) {
                [void](New-Item -ItemType Directory -Path $carpetaEventos -Force)
            }

            # Limpiar nombre de archivo y extraer extensión
            $nombreOriginal = [string]$datos.nombreArchivo
            $ext = [System.IO.Path]::GetExtension($nombreOriginal).ToLower()
            if ([string]::IsNullOrEmpty($ext) -or $ext -notin @(".jpg", ".jpeg", ".png", ".webp", ".gif")) {
                $ext = ".jpg"
            }
            $selloTiempo = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
            $nuevoNombre = "evento-$selloTiempo$ext"
            $rutaFisica = Join-Path $carpetaEventos $nuevoNombre

            # Decodificar Base64 y guardar en disco dentro de img/eventos/
            $base64Limpio = ([string]$datos.base64) -replace '^data:image/[a-zA-Z0-9+.-]+;base64,', ''
            $bytesImagen = [Convert]::FromBase64String($base64Limpio)
            [System.IO.File]::WriteAllBytes($rutaFisica, $bytesImagen)

            $rutaWeb = "img/eventos/$nuevoNombre"
            Responder-Json $res @{
                ok = $true
                ruta = $rutaWeb
                mensaje = "Imagen guardada en $rutaWeb"
            }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 7: Crear o Editar Noticia / Evento Escolar (INSERT / UPDATE)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/noticias/guardar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            if ($datos.idNoticia -and [int]$datos.idNoticia -gt 0) {
                $sqlNoticia = @"
UPDATE dbo.NoticiasEventos
SET Titulo = @tit, Categoria = @cat, EtiquetaVisible = @eti, UbicacionFecha = @ubi, Resumen = @res, ImagenUrl = @img
WHERE IdNoticia = @id
"@
                Ejecutar-Sql $sqlNoticia @{
                    "@tit" = [string]$datos.titulo
                    "@cat" = [string]$datos.categoria
                    "@eti" = [string]$datos.etiqueta
                    "@ubi" = [string]$datos.ubicacion
                    "@res" = [string]$datos.resumen
                    "@img" = [string]$datos.imagenUrl
                    "@id"  = [int]$datos.idNoticia
                }
            } else {
                $sqlNoticia = @"
INSERT INTO dbo.NoticiasEventos (Titulo, Categoria, EtiquetaVisible, UbicacionFecha, Resumen, ImagenUrl, Destacado)
VALUES (@tit, @cat, @eti, @ubi, @res, @img, 1)
"@
                Ejecutar-Sql $sqlNoticia @{
                    "@tit" = [string]$datos.titulo
                    "@cat" = [string]$datos.categoria
                    "@eti" = [string]$datos.etiqueta
                    "@ubi" = [string]$datos.ubicacion
                    "@res" = [string]$datos.resumen
                    "@img" = [string]$datos.imagenUrl
                }
            }
            Responder-Json $res @{ ok = $true; mensaje = "Noticia/Evento guardado en SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 8: Eliminar Noticia / Evento Escolar (DELETE)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/noticias/eliminar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            Ejecutar-Sql "DELETE FROM dbo.NoticiasEventos WHERE IdNoticia = @id" @{
                "@id" = [int]$datos.idNoticia
            }
            Responder-Json $res @{ ok = $true; mensaje = "Evento eliminado de SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 9: Actualizar Estadísticas y Vacantes por Nivel (UPDATE)
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/estadisticas/guardar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $sqlEst = @"
UPDATE dbo.EstadisticasInstitucionales
SET AniosTrayectoria = @anios,
    TotalDocentes = @doc,
    TotalEstudiantes = @est,
    TotalAmbientes = @amb,
    UltimaActualizacion = GETDATE()
WHERE IdEstadistica = 1
"@
            Ejecutar-Sql $sqlEst @{
                "@anios" = [int]$datos.aniosTrayectoria
                "@doc"   = [int]$datos.totalDocentes
                "@est"   = [int]$datos.totalEstudiantes
                "@amb"   = [int]$datos.totalAmbientes
            }

            if ($null -ne $datos.vacantesInicial) {
                Ejecutar-Sql "UPDATE dbo.VacantesPorNivel SET VacantesDisponibles = @v WHERE ClaveNivel = N'inicial'" @{ "@v" = [int]$datos.vacantesInicial }
            }
            if ($null -ne $datos.vacantesPrimaria) {
                Ejecutar-Sql "UPDATE dbo.VacantesPorNivel SET VacantesDisponibles = @v WHERE ClaveNivel = N'primaria'" @{ "@v" = [int]$datos.vacantesPrimaria }
            }
            if ($null -ne $datos.vacantesSecundaria) {
                Ejecutar-Sql "UPDATE dbo.VacantesPorNivel SET VacantesDisponibles = @v WHERE ClaveNivel = N'secundaria'" @{ "@v" = [int]$datos.vacantesSecundaria }
            }

            Responder-Json $res @{ ok = $true; mensaje = "Estadísticas y vacantes actualizadas en SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # ENDPOINT 10: Crear o Eliminar Comunicado Oficial
        # --------------------------------------------------------------------
        if ($ruta -eq "/api/comunicados/guardar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            $sqlCom = "INSERT INTO dbo.ComunicadosOficiales (Titulo, Detalle, DirigidoA, Activo) VALUES (@t, @d, @dir, 1)"
            Ejecutar-Sql $sqlCom @{
                "@t"   = [string]$datos.titulo
                "@d"   = [string]$datos.detalle
                "@dir" = [string]$datos.dirigidoA
            }
            Responder-Json $res @{ ok = $true; mensaje = "Comunicado publicado en SQL Server." }
            continue
        }

        if ($ruta -eq "/api/comunicados/eliminar" -and $metodo -eq "POST") {
            $datos = Leer-CuerpoJson $req
            Ejecutar-Sql "DELETE FROM dbo.ComunicadosOficiales WHERE IdComunicado = @id" @{
                "@id" = [int]$datos.idComunicado
            }
            Responder-Json $res @{ ok = $true; mensaje = "Comunicado eliminado de SQL Server." }
            continue
        }

        # --------------------------------------------------------------------
        # SERVIDOR DE ARCHIVOS ESTÁTICOS (index.html, admin.html, css, js, img)
        # --------------------------------------------------------------------
        $rutaRelativa = $ruta.TrimStart('/')
        if ([string]::IsNullOrEmpty($rutaRelativa)) { $rutaRelativa = "index.html" }
        $archivoFisico = Join-Path $raizProyecto ($rutaRelativa -replace '/', '\')

        if (Test-Path $archivoFisico -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($archivoFisico).ToLower()
            $tipoContenido = if ($tiposMime.ContainsKey($extension)) { $tiposMime[$extension] } else { "application/octet-stream" }
            $bytesArchivo = [System.IO.File]::ReadAllBytes($archivoFisico)
            $res.ContentType = $tipoContenido
            $res.ContentLength64 = $bytesArchivo.Length
            $res.StatusCode = 200
            $res.OutputStream.Write($bytesArchivo, 0, $bytesArchivo.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.OutputStream.Close()
    } catch {
        try {
            Responder-Json $res @{ ok = $false; error = $_.Exception.Message } 500
        } catch {}
    }
}
