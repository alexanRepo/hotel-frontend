import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import * as M from '../models/api.models';
class Catalog<T, R> {
  protected api = inject(ApiService);
  constructor(protected path: string) {}
  list(q: M.Query = {}) {
    return this.api.get<M.Pagina<T>>(this.path, q);
  }
  create(body: R) {
    return this.api.post<T>(this.path, body);
  }
  update(id: number, body: R) {
    return this.api.put<T>(`${this.path}/${id}`, body);
  }
  state(id: number, activo: boolean) {
    return this.api.patch<T>(`${this.path}/${id}/estado`, { activo });
  }
}
@Injectable({ providedIn: 'root' })
export class HuespedService extends Catalog<M.Huesped, M.HuespedRequest> {
  constructor() {
    super('/huespedes');
  }
  get(id: number) {
    return this.api.get<M.Huesped>(`${this.path}/${id}`);
  }
}
@Injectable({ providedIn: 'root' })
export class TipoService extends Catalog<M.Tipo, M.TipoRequest> {
  constructor() {
    super('/tipos-habitacion');
  }
}
@Injectable({ providedIn: 'root' })
export class HabitacionService extends Catalog<M.Habitacion, M.HabitacionRequest> {
  constructor() {
    super('/habitaciones');
  }
  get(id: number) {
    return this.api.get<M.Habitacion>(`${this.path}/${id}`);
  }
  operativo(id: number, estado: M.EstadoHabitacion) {
    return this.api.patch<M.Habitacion>(`${this.path}/${id}/operativo`, { estado });
  }
  disponibles(q: M.Query) {
    return this.api.get<M.Pagina<M.Habitacion>>('/habitaciones/disponibilidad', q);
  }
}
@Injectable({ providedIn: 'root' })
export class ServicioService extends Catalog<M.Servicio, M.ServicioRequest> {
  constructor() {
    super('/servicios');
  }
}
@Injectable({ providedIn: 'root' })
export class UsuarioService extends Catalog<M.Usuario, M.UsuarioRequest> {
  constructor() {
    super('/usuarios');
  }
  get(id: number) {
    return this.api.get<M.Usuario>(`${this.path}/${id}`);
  }
  rol(id: number, rol: M.Rol) {
    return this.api.patch<M.Usuario>(`${this.path}/${id}/rol`, { rol });
  }
}
@Injectable({ providedIn: 'root' })
export class ReservaService {
  private api = inject(ApiService);
  list(q: M.Query) {
    return this.api.get<M.Pagina<M.Reserva>>('/reservas', q);
  }
  get(id: number) {
    return this.api.get<M.Detalle>(`/reservas/${id}`);
  }
  create(body: M.ReservaRequest) {
    return this.api.post<M.Reserva>('/reservas', body);
  }
  reprogramar(id: number, body: M.Reprogramar) {
    return this.api.put<M.Reserva>(`/reservas/${id}/reprogramacion`, body);
  }
  extender(id: number, salida: string) {
    return this.api.put<M.Reserva>(`/reservas/${id}/extension`, { salida });
  }
  accion(id: number, accion: 'check-in' | 'check-out' | 'cancelacion' | 'no-presentado') {
    return this.api.put<unknown>(`/reservas/${id}/${accion}`);
  }
  consumo(id: number, servicioId: number, cantidad: number) {
    return this.api.post<M.Consumo>(`/reservas/${id}/consumos`, { servicioId, cantidad });
  }
  anularConsumo(id: number, consumo: number, motivo: string) {
    return this.api.put<M.Consumo>(`/reservas/${id}/consumos/${consumo}/anulacion`, { motivo });
  }
  pagar(id: number, body: M.PagoRequest) {
    return this.api.post<M.Pago>(`/reservas/${id}/pagos`, body);
  }
  anularPago(id: number, pago: number, motivo: string) {
    return this.api.put<M.Pago>(`/reservas/${id}/pagos/${pago}/anulacion`, { motivo });
  }
  devolver(id: number, pago: number, body: M.DevolucionRequest) {
    return this.api.post<M.Devolucion>(`/reservas/${id}/pagos/${pago}/devoluciones`, body);
  }
}
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private api = inject(ApiService);
  ocupacion() {
    return this.api.get<M.Ocupacion>('/reportes/ocupacion');
  }
  agenda(fecha: string) {
    return this.api.get<M.Agenda>('/reportes/agenda', { fecha });
  }
  reservas(desde: string, hasta: string) {
    return this.api.get<M.Grupo[]>('/reportes/reservas', { desde, hasta });
  }
  caja(desde: string, hasta: string) {
    return this.api.get<M.Caja>('/reportes/caja', { desde, hasta });
  }
  medios(desde: string, hasta: string) {
    return this.api.get<M.Grupo[]>('/reportes/medios-pago', { desde, hasta });
  }
  saldos(pagina = 0) {
    return this.api.get<M.Pagina<M.Saldo>>('/reportes/saldos', { pagina, tamanio: 20 });
  }
}
