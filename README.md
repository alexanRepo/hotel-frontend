# Hotel Frontend

Panel interno de un hotel con Angular standalone, TypeScript estricto y Tailwind CSS. Consume el backend Spring Boot existente: no incluye backend, migraciones, datos simulados ni registro público.

## Inicio rápido en Windows / PowerShell

1. Extrae el ZIP. La carpeta `hotel-frontend` debe contener `package.json` y `package-lock.json`.
2. Instala Node.js **22.12 o superior dentro de 22.x**, o **24.x**. Usa Node 24 LTS para reproducir este entorno.
3. Abre PowerShell en esa carpeta:

```powershell
node --version
npm --version
npm ci
npm start
```

4. Abre **http://localhost:4200**.
5. Inicia sesión con una cuenta ADMIN o RECEPCIONISTA que ya exista en tu backend. No se incluyen contraseñas ni un usuario de demostración.

No necesitas instalar Angular CLI globalmente. Si PowerShell bloquea `npm.ps1`, usa `npm.cmd ci` y `npm.cmd start`.

## Backend y configuración

El backend debe estar iniciado por separado en **http://localhost:8085** y conectado a PostgreSQL. Este proyecto no cambia sus archivos ni su base de datos. Usa la configuración Java 21 y las variables de entorno de tu backend ya existente.

`public/config.json` contiene la configuración pública de ejecución:

```json
{
  "apiUrl": "http://localhost:8085/api",
  "hotelName": "Hotel · Gestión"
}
```

Reinicia o recarga el frontend después de cambiarla. No pongas secretos, contraseñas de PostgreSQL o la clave JWT en este archivo: todo el frontend es público para el navegador.

CORS del backend debe permitir **http://localhost:4200**. En el backend inspeccionado se configura con `CORS_ALLOWED_ORIGINS`, cuyo valor predeterminado ya permite ese origen. `localhost` y `127.0.0.1` son orígenes diferentes; usa la misma dirección configurada.

La aplicación carga `config.json` antes de restaurar la sesión. No requiere recompilar para cambiar la URL. Una instalación futura podrá usar otra URL HTTPS o `/api` detrás de un proxy del mismo origen. El servidor estático deberá devolver `index.html` en las rutas de Angular. No se ha configurado ni realizado ningún despliegue.

## Funciones

- Login, sesión con vencimiento, cierre de sesión y cambio de contraseña.
- Menú adaptable, rutas protegidas, perfil y páginas 403/404.
- Huéspedes: búsqueda del servidor, paginación, creación, edición y activación.
- Tipos, habitaciones y servicios: consultas para ambos roles; administración del catálogo para ADMIN.
- Estado operativo de habitaciones para recepción: habilitada, limpieza o mantenimiento. Una habitación habilitada no implica disponibilidad por fechas.
- Disponibilidad por fechas, personas y tipo; selección de habitación y huésped para reservar.
- Reservas con filtros, detalle del titular histórico, reprogramación, extensión, cancelación, no presentado, check-in y check-out.
- Consumos con nombre/precio histórico y anulaciones conservadas en el historial.
- Pagos manuales, anulaciones y devoluciones; saldo devuelto por el backend.
- Usuarios y reportes solo para ADMIN. Se impide desactivar o quitar el rol al propio administrador.
- Reportes de ocupación, agenda, reservas, caja, medios y saldos. RECEPCIONISTA usa rutas operativas permitidas y no consulta reportes.

Los selectores tienen paginación del servidor: no se trata la primera página como si fuera toda la base. Los catálogos reutilizan una pantalla configurable para mantener el código compacto.

## Seguridad y movimientos pendientes

El token se conserva en `sessionStorage`, separado por pestaña y eliminado al cerrar sesión o expirar. **Un XSS podría leerlo**: no se usa HTML no confiable ni `innerHTML` y se debe mantener la política de seguridad del sitio al desplegar. Los permisos reales siempre los verifica el backend.

El interceptor adjunta Bearer únicamente al origen y prefijo de `apiUrl`. No lo envía a otros dominios o recursos externos. Un 401 termina la sesión; un 403 muestra falta de permisos y la mantiene. Al recargar, `/auth/me` actualiza los datos del usuario.

Los pagos y devoluciones se registran manualmente. El sistema no procesa tarjetas, no solicita sus datos y no verifica transferencias bancarias.

Antes de enviar se guarda **UUID + contenido exacto + reserva + usuario** en `sessionStorage`. Un error de conexión, timeout o 5xx conserva el intento. Al recargar el detalle se comprueba su UUID en el historial; si aparece, queda resuelto sin repetirlo. Si no aparece, el botón de reintento utiliza la misma clave y contenido. No se permite preparar otro movimiento mientras exista uno pendiente del usuario. El cambio de usuario no expone el intento del usuario anterior.

Los rechazos HTTP 400/403/404/409/422 se consideran respuestas definitivas del backend. Se refresca el detalle antes de preparar una operación corregida. Un 401 conserva la operación para resolverla al volver a entrar. No borres manualmente el almacenamiento de sesión ni cierres la pestaña si hay una operación incierta: primero verifica el historial con administración.

La validación de importes usa centavos enteros; las fechas de alojamiento no se convierten a UTC y “hoy” se calcula en America/Lima. Los totales, tarifas históricas y permisos los decide la API.

## Estructura

```text
src/app/
  core/
    auth/           sesión
    guards/         autenticación y ADMIN
    interceptors/   Bearer y respuesta 401
    models/         contratos de solicitudes y respuestas
    services/       configuración, HTTP y servicios de dominio
  shared/
    components/     diálogos, tablas, avisos, selectores y paginación
    pipes/          soles y fechas
  layouts/          navegación adaptable
  features/
    login/          acceso y mi cuenta
    dashboard/      inicio según rol
    catalog/        pantalla reutilizada y campos compartidos
    huespedes/      configuración del formulario
    tipos-habitacion/
    habitaciones/
    servicios/
    usuarios/
    reservas/       listado, disponibilidad, creación y detalle
    reportes/       informes de ADMIN
```

Las funcionalidades se cargan mediante rutas diferidas. No hay mocks en producción. Las respuestas simuladas están exclusivamente en archivos `*.spec.ts`.

## Comandos

```powershell
npm ci
npm start
npm run build
npm test
npm run format:check
```

`npm run build` genera `dist/hotel-frontend/browser`. `npm test` ejecuta Vitest sin modo observación. El límite de página de la aplicación es 20 y los selectores usan 10, inferiores al máximo 100 de la API.

## Prueba manual del flujo completo

Usa una base de pruebas, con cuentas y registros que puedas modificar.

1. Inicia el backend, luego `npm start`. Comprueba login y `/mi-cuenta`.
2. Como ADMIN, crea un tipo con capacidad y tarifa, una habitación y un servicio.
3. Crea un huésped con documento válido. DNI usa 8 dígitos; CE y pasaporte admiten los formatos indicados por el formulario.
4. Busca disponibilidad desde hoy en Lima, elige la habitación y el huésped, y confirma. Revisa código, fechas y tarifa en el detalle.
5. Prueba una reserva solapada: debe mostrarse el conflicto del backend. Dos reservas consecutivas pueden compartir la fecha de salida/entrada.
6. Con entrada hoy y habitación habilitada, registra check-in. Añade un consumo y revisa el saldo.
7. Registra un pago menor o igual al saldo. Comprueba historial y saldo actualizado. No interpretes este registro como validación bancaria.
8. En una reserva de prueba, desconecta la red durante un movimiento. Si hay respuesta incierta, recarga y reintenta desde el aviso: debe mantenerse el UUID. Verifica una sola fila en el historial.
9. Como ADMIN, prueba devolución parcial; no debe exceder el disponible. No se puede anular un pago que tenga devoluciones.
10. Completa el saldo y realiza check-out. La habitación debe quedar en limpieza. No se permiten cambios financieros después de finalizar.
11. Revisa la agenda y reportes. Los pagos anulados se excluyen de su fecha original y las devoluciones se contabilizan en su propia fecha. El importe reservado no es cobro.
12. Entra como RECEPCIONISTA: usuarios/reportes y escrituras administrativas no deben aparecer. Una URL administrativa directa debe mostrar 403 sin perder sesión.
13. Comprueba el menú móvil, navegación por Tab, cierre de diálogos con Escape y formato PEN.

## Verificación de esta entrega

Consulta `VALIDACION.md` para las versiones exactas, los comandos ejecutados y sus resultados. La compilación y pruebas automatizadas no equivalen a una validación completa del sistema real.

**Pendiente en tu equipo:** integración con tu backend/PostgreSQL y revisión visual/teclado en navegador real. No se ejecutó tu backend local desde este entorno y no se realizó una prueba E2E contra él. Tampoco se ejecutó un navegador para una revisión visual.

## Fuentes de contratos

Se inspeccionaron `ApiDtos.java`, controladores de autenticación, huéspedes, tipos, habitaciones, servicios, usuarios, reservas y reportes, además de la configuración de seguridad del `hotel-backend` disponible. Se consumen sus rutas y campos existentes. No se inventaron endpoints de exportación, registro público, envío de correos ni pasarelas de pago.
