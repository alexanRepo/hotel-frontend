import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DevolucionRequest, PagoRequest } from '../models/api.models';
export type Pending =
  | { reservaId: number; kind: 'pago'; body: PagoRequest }
  | { reservaId: number; kind: 'devolucion'; pagoId: number; body: DevolucionRequest };
@Injectable({ providedIn: 'root' })
export class PendingService {
  private auth = inject(AuthService);
  private key() {
    const user = this.auth.user();
    if (!user) throw new Error('Inicia sesión antes de registrar movimientos.');
    return `hotel.pending.v1.${user.id}`;
  }
  read(): Pending | null {
    const raw = sessionStorage.getItem(this.key());
    if (!raw) return null;
    try {
      const p: unknown = JSON.parse(raw);
      if (
        p &&
        typeof p === 'object' &&
        'reservaId' in p &&
        typeof p.reservaId === 'number' &&
        'kind' in p &&
        (p.kind === 'pago' || p.kind === 'devolucion') &&
        'body' in p &&
        p.body &&
        typeof p.body === 'object' &&
        'claveOperacion' in p.body &&
        typeof p.body.claveOperacion === 'string'
      )
        return p as Pending;
    } catch {
      /* Se conserva una operación ilegible hasta revisión manual. */
    }
    throw new Error(
      'El intento pendiente no puede leerse. No registres otro movimiento; verifica el historial con administración.',
    );
  }
  save(p: Pending) {
    const previous = this.read();
    if (previous && JSON.stringify(previous) !== JSON.stringify(p))
      throw new Error(
        `Primero resuelve el movimiento pendiente de la reserva ${previous.reservaId}.`,
      );
    sessionStorage.setItem(this.key(), JSON.stringify(p));
  }
  clear() {
    sessionStorage.removeItem(this.key());
  }
  definitive(status: number) {
    return [400, 403, 404, 409, 422].includes(status);
  }
}
