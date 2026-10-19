import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { PendingService, Pending } from '../../core/services/pending.service';
import { ReservaService, HabitacionService } from '../../core/services/domain.services';
import { Detalle, Habitacion, Reserva } from '../../core/models/api.models';
import { DetailPage } from './detail.page';
import { NuevaPage } from './nueva.page';
import { limaToday, plusDays } from '../../shared/utils';
const reserva: Reserva = {
  id: 1,
  codigo: 'PRUEBA',
  huespedId: 1,
  habitacionId: 1,
  numeroHabitacion: '101',
  titular: {
    nombres: 'Ana',
    apellidos: 'Prueba',
    documento: '12345678',
    tipoDocumento: 'DNI',
    telefono: null,
    correo: null,
  },
  entrada: limaToday(),
  salida: plusDays(limaToday(), 2),
  personas: 2,
  noches: 2,
  tarifa: 100,
  alojamiento: 200,
  estado: 'CONFIRMADA',
  observaciones: null,
  creadorId: 1,
  creado: '2026-10-19T10:00:00Z',
};
function detail(): Detalle {
  return {
    reserva: { ...reserva },
    estadia: null,
    consumos: [],
    pagos: [],
    devoluciones: [],
    financiero: {
      alojamiento: 200,
      consumos: 0,
      total: 200,
      pagosVigentes: 0,
      devoluciones: 0,
      netoCobrado: 0,
      saldoPendiente: 200,
      moneda: 'PEN',
    },
  };
}
const room: Habitacion = {
  id: 1,
  numero: '101',
  piso: 1,
  activo: true,
  estado: 'HABILITADA',
  tipo: { id: 1, nombre: 'Doble', descripcion: null, capacidad: 2, tarifa: 100, activo: true },
};
describe('Reservas y movimientos idempotentes', () => {
  const user = signal({ id: 1, rol: 'ADMIN' });
  let data: Detalle;
  let service: {
    get: ReturnType<typeof vi.fn>;
    pagar: ReturnType<typeof vi.fn>;
    devolver: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    sessionStorage.clear();
    user.set({ id: 1, rol: 'ADMIN' });
    data = detail();
    service = {
      get: vi.fn(() => of(data)),
      pagar: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 0 }))),
      devolver: vi.fn(() => of({ id: 1 })),
      create: vi.fn(() => of(reserva)),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })), snapshot: { data: {} } },
        },
        { provide: AuthService, useValue: { user, admin: () => user().rol === 'ADMIN' } },
        { provide: ReservaService, useValue: service },
        {
          provide: HabitacionService,
          useValue: {
            disponibles: () =>
              of({ contenido: [], pagina: 0, tamanio: 20, totalElementos: 0, totalPaginas: 0 }),
          },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  it('conserva UUID y contenido tras fallo de red, recarga y reintento', () => {
    const page = TestBed.createComponent(DetailPage).componentInstance;
    page.show('pago');
    page.form.patchValue({ monto: '100.00', medio: 'YAPE', referencia: 'ref' });
    page.submit();
    expect(service.pagar).toHaveBeenCalledTimes(1);
    const original = service.pagar.mock.calls[0][1];
    expect(original.claveOperacion).toMatch(/^[0-9a-f-]{36}$/);
    expect(TestBed.inject(PendingService).read()?.body).toEqual(original);
    const restored = TestBed.createComponent(DetailPage).componentInstance;
    service.pagar.mockReturnValue(of({ id: 4 }));
    restored.sendPending();
    expect(service.pagar.mock.calls[1][1]).toEqual(original);
    expect(TestBed.inject(PendingService).read()).toBeNull();
  });
  it('no cambia un intento pendiente ni lo revela a otro usuario', () => {
    const store = TestBed.inject(PendingService);
    const p: Pending = {
      kind: 'pago',
      reservaId: 1,
      body: { claveOperacion: crypto.randomUUID(), monto: 20, medio: 'EFECTIVO', referencia: null },
    };
    store.save(p);
    expect(() => store.save({ ...p, body: { ...p.body, monto: 30 } })).toThrow();
    user.set({ id: 2, rol: 'RECEPCIONISTA' });
    expect(store.read()).toBeNull();
    user.set({ id: 1, rol: 'ADMIN' });
    expect(store.read()).toEqual(p);
  });
  it('resuelve un pago pendiente encontrado en historial sin repetirlo', () => {
    const store = TestBed.inject(PendingService);
    const key = crypto.randomUUID();
    store.save({
      kind: 'pago',
      reservaId: 1,
      body: { claveOperacion: key, monto: 20, medio: 'EFECTIVO', referencia: null },
    });
    data.pagos.push({
      id: 2,
      claveOperacion: key,
      monto: 20,
      medio: 'EFECTIVO',
      referencia: null,
      anulado: false,
      motivoAnulacion: null,
      creado: '',
      anuladoEn: null,
      usuarioId: 1,
      anuladoPorId: null,
    });
    TestBed.createComponent(DetailPage);
    expect(store.read()).toBeNull();
    expect(service.pagar).not.toHaveBeenCalled();
  });
  it('condiciona check-in, check-out y cancelación al estado y saldo', () => {
    const page = TestBed.createComponent(DetailPage).componentInstance;
    expect(page.canCheckIn()).toBe(true);
    expect(page.canCancel()).toBe(true);
    expect(page.canCheckOut()).toBe(false);
    page.data.set({
      ...data,
      reserva: { ...data.reserva, estado: 'EN_ESTADIA' },
      financiero: { ...data.financiero, saldoPendiente: 0, netoCobrado: 200 },
    });
    expect(page.canCheckIn()).toBe(false);
    expect(page.canCancel()).toBe(false);
    expect(page.canCheckOut()).toBe(true);
    page.data.set({ ...data, reserva: { ...data.reserva, estado: 'FINALIZADA' } });
    expect(page.active()).toBe(false);
  });
  it('valida capacidad y envía reserva sin precios ni totales', () => {
    const page = TestBed.createComponent(NuevaPage).componentInstance;
    page.selected.set(room);
    page.guest.set({ id: 5, label: 'Ana' });
    page.form.controls.personas.setValue(3);
    page.selected.set(room);
    page.save();
    expect(service.create).not.toHaveBeenCalled();
    page.form.controls.personas.setValue(2);
    page.selected.set(room);
    page.save();
    expect(service.create).toHaveBeenCalledTimes(1);
    const body = service.create.mock.calls[0][0];
    expect(body.huespedId).toBe(5);
    expect(body.habitacionId).toBe(1);
    expect(body.precio).toBeUndefined();
    expect(body.total).toBeUndefined();
  });
  it('reintenta devolución con el mismo UUID y monto', () => {
    const store = TestBed.inject(PendingService);
    const p: Pending = {
      kind: 'devolucion',
      reservaId: 1,
      pagoId: 9,
      body: { claveOperacion: crypto.randomUUID(), monto: 10, motivo: 'Prueba' },
    };
    store.save(p);
    service.devolver.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const page = TestBed.createComponent(DetailPage).componentInstance;
    page.sendPending();
    expect(store.read()).toEqual(p);
    page.sendPending();
    expect(service.devolver.mock.calls[0]).toEqual(service.devolver.mock.calls[1]);
    expect(store.read()).toBeNull();
  });
});
