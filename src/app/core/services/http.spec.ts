import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { ReservaService, HabitacionService } from './domain.services';
import { ListState } from './list-state';
import { Reserva, Pagina } from '../models/api.models';
import { apiError } from './errors';
describe('Paginación, búsquedas y errores HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía filtros y paginación al servidor y cancela la búsqueda anterior', () => {
    const service = TestBed.inject(ReservaService);
    const list = TestBed.runInInjectionContext(
      () => new ListState<Reserva>((q) => service.list(q)),
    );
    list.load({ estado: 'CONFIRMADA', desde: '2026-10-19' });
    const old = http.expectOne((r) => r.url.endsWith('/reservas'));
    list.load({ estado: 'EN_ESTADIA', pagina: 2 });
    expect(old.cancelled).toBe(true);
    const next = http.expectOne((r) => r.url.endsWith('/reservas'));
    expect(next.request.params.get('pagina')).toBe('2');
    expect(next.request.params.get('tamanio')).toBe('20');
    expect(next.request.params.get('estado')).toBe('EN_ESTADIA');
    expect(next.request.params.get('desde')).toBe('2026-10-19');
    next.flush({ contenido: [], pagina: 2, tamanio: 20, totalElementos: 0, totalPaginas: 0 });
    expect(list.data().contenido).toEqual([]);
    expect(list.error()).toBe('');
  });
  it('consulta disponibilidad real sin tipo vacío', () => {
    TestBed.inject(HabitacionService)
      .disponibles({
        entrada: '2026-10-19',
        salida: '2026-10-21',
        personas: 2,
        tipoId: null,
        pagina: 0,
        tamanio: 10,
      })
      .subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/habitaciones/disponibilidad'));
    expect(req.request.params.has('tipoId')).toBe(false);
    expect(req.request.params.get('personas')).toBe('2');
    req.flush({ contenido: [] });
  });
  it('conserva errores por campo, distingue conflictos y oculta detalles internos 500', () => {
    expect(
      apiError(
        new HttpErrorResponse({
          status: 400,
          error: { detail: 'Datos inválidos', errores: { correo: 'Correo ocupado' } },
        }),
      ).fields['correo'],
    ).toBe('Correo ocupado');
    expect(
      apiError(new HttpErrorResponse({ status: 409, error: { detail: 'No hay disponibilidad' } }))
        .message,
    ).toBe('No hay disponibilidad');
    expect(
      apiError(new HttpErrorResponse({ status: 500, error: { detail: 'SQL secreto' } })).message,
    ).not.toContain('SQL');
    expect(apiError(new HttpErrorResponse({ status: 0 })).message).toContain('conexión');
  });
});
