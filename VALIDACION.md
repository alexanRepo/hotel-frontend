# Verificación de la entrega

Fecha: 19 de octubre de 2026 (UTC). Entorno de construcción Linux.

## Versiones instaladas

| Herramienta                        | Versión |
| ---------------------------------- | ------- |
| Node.js                            | 24.19.0 |
| npm                                | 11.9.0  |
| Angular                            | 21.2.25 |
| Angular CLI                        | 21.2.27 |
| TypeScript                         | 5.9.3   |
| Tailwind CSS                       | 4.3.3   |
| Lucide Angular (`@lucide/angular`) | 1.59.0  |
| Vitest                             | 4.1.12  |

El lockfile fija la resolución exacta. Tailwind se integra con PostCSS mediante `@tailwindcss/postcss`, no con la configuración de Tailwind 3.

## Comandos ejecutados

| Comando         | Resultado                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm install`   | Instalación realizada; se corrigió la compatibilidad inicial de iconos y se adoptó el paquete actual `@lucide/angular`. |
| `npm ci`        | Instalación limpia correcta con el lockfile final, 493 paquetes.                                                        |
| `npm run build` | Compilación de producción correcta con TypeScript y plantillas estrictos, dentro del presupuesto configurado.           |
| `npm test`      | 5 archivos, **21 pruebas aprobadas**, sin errores no controlados.                                                       |

Se comprobó autenticación y vencimiento; guardas de rol; restricción del token al origen y prefijo de la API; diferencia entre 401 y 403; rutas de retorno internas; paginación/filtros del servidor y cancelación de solicitudes anteriores; errores ProblemDetail; fechas de Lima; montos en centavos; límite de contraseña en bytes; capacidad y payload de reserva sin precios; acciones por estado; y UUID/contenido persistidos al reintentar pagos y devoluciones, incluso tras recrear la pantalla.

Una prueba renderiza el formulario de login en JSDOM, incluidos iconos, validación y cambio de visibilidad de contraseña. No equivale a una revisión visual en navegador real.

## Límites de la verificación

- No se ejecutó el backend Spring Boot ni PostgreSQL en este entorno.
- La integración HTTP real con tu equipo y el flujo hotelero completo siguen pendientes.
- No se ejecutó navegador real, revisión visual de escritorio/móvil ni E2E.
- Los contratos se contrastaron con el código Java disponible. Si tu backend local cambió después, habrá que contrastar su OpenAPI/DTO actual.
- No hay despliegue, contenedores, pasarela de pago, PDF, Excel ni registro público.

El README contiene un recorrido manual para completar esas comprobaciones localmente.
