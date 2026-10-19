import { HttpErrorResponse } from '@angular/common/http';
export interface ApiError {
  message: string;
  fields: Record<string, string>;
  status: number;
}
export function apiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse))
    return {
      message: error instanceof Error ? error.message : 'No se pudo completar la operación.',
      fields: {},
      status: 0,
    };
  const status = error.status;
  const defaults: Record<number, string> = {
    0: 'No hay conexión con el backend. Comprueba que esté ejecutándose y que CORS permita este origen.',
    400: 'Revisa los datos enviados.',
    401: 'La sesión no es válida. Inicia sesión nuevamente.',
    403: 'Tu rol no tiene permiso para esta operación.',
    404: 'El registro no existe o ya no está disponible.',
    409: 'Los datos cambiaron o existe un conflicto. Actualiza la información.',
    500: 'El servidor no pudo completar la operación. Verifica el resultado antes de reintentar.',
  };
  const body: unknown = error.error;
  let message = defaults[status] ?? 'No se pudo completar la operación.';
  const fields: Record<string, string> = {};
  if (body && typeof body === 'object') {
    if (
      status >= 400 &&
      status < 500 &&
      status !== 401 &&
      status !== 403 &&
      'detail' in body &&
      typeof body.detail === 'string'
    )
      message = body.detail;
    if ('errores' in body && body.errores && typeof body.errores === 'object')
      for (const [key, value] of Object.entries(body.errores))
        if (typeof value === 'string') fields[key] = value;
  }
  return { message, fields, status };
}
