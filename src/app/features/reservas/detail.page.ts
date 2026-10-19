import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, finalize, switchMap, catchError, EMPTY } from 'rxjs';
import { ReservaService } from '../../core/services/domain.services';
import { AuthService } from '../../core/auth/auth.service';
import { PendingService, Pending } from '../../core/services/pending.service';
import { Detalle, Pago, Medio } from '../../core/models/api.models';
import { ApiError, apiError } from '../../core/services/errors';
import { Badge } from '../../shared/components/badge';
import { Feedback, Loading } from '../../shared/components/feedback';
import { Modal } from '../../shared/components/modal';
import { Lookup, Choice } from '../../shared/components/lookup';
import { ConfirmService } from '../../shared/components/confirm';
import { PenPipe, FechaPipe } from '../../shared/pipes/format.pipes';
import {
  cents,
  moneyValidator,
  limaToday,
  validRange,
  validDate,
  nullable,
} from '../../shared/utils';
type Dialog =
  | 'reprogramar'
  | 'extender'
  | 'consumo'
  | 'pago'
  | 'devolucion'
  | 'anular-consumo'
  | 'anular-pago'
  | '';
@Component({
  selector: 'app-reserva-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Badge,
    Feedback,
    Loading,
    Modal,
    Lookup,
    PenPipe,
    FechaPipe,
  ],
  templateUrl: './detail.page.html',
})
export class DetailPage {
  private service = inject(ReservaService);
  auth = inject(AuthService);
  private pendingStore = inject(PendingService);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmService);
  private destroy = inject(DestroyRef);
  id = 0;
  data = signal<Detalle | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal<ApiError | null>(null);
  success = signal('');
  dialog = signal<Dialog>('');
  tab = signal('resumen');
  pending = signal<Pending | null>(null);
  pendingBlocked = signal(false);
  today = limaToday();
  room = signal<Choice | null>(null);
  serviceChoice = signal<Choice | null>(null);
  target = 0;
  medios: Medio[] = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
  form = new FormGroup({
    entrada: new FormControl('', { nonNullable: true }),
    salida: new FormControl('', { nonNullable: true }),
    personas: new FormControl(1, { nonNullable: true }),
    cantidad: new FormControl(1, { nonNullable: true }),
    monto: new FormControl('', { nonNullable: true }),
    medio: new FormControl<Medio>('EFECTIVO', { nonNullable: true }),
    referencia: new FormControl('', { nonNullable: true, validators: Validators.maxLength(150) }),
    motivo: new FormControl('', { nonNullable: true, validators: Validators.maxLength(255) }),
  });
  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.id = Number(params.get('id'));
          this.data.set(null);
          this.loading.set(true);
          return this.service.get(this.id).pipe(
            catchError((e) => {
              this.loading.set(false);
              this.error.set(apiError(e));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (d) => {
          this.loading.set(false);
          this.accept(d);
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(apiError(e));
        },
      });
  }
  accept(d: Detalle) {
    this.data.set(d);
    this.readPending();
    const p = this.pending();
    if (p && p.reservaId === this.id) {
      const found =
        p.kind === 'pago'
          ? d.pagos.some((x) => x.claveOperacion === p.body.claveOperacion)
          : d.devoluciones.some((x) => x.claveOperacion === p.body.claveOperacion);
      if (found) {
        this.pendingStore.clear();
        this.pending.set(null);
        this.success.set('El movimiento pendiente ya figura en el historial.');
      }
    }
  }
  readPending() {
    try {
      this.pending.set(this.pendingStore.read());
      this.pendingBlocked.set(false);
    } catch (e) {
      this.pendingBlocked.set(true);
      this.error.set(apiError(e));
    }
  }
  reload() {
    this.loading.set(true);
    this.service
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({ next: (d) => this.accept(d), error: (e) => this.error.set(apiError(e)) });
  }
  active() {
    const s = this.data()?.reserva.estado;
    return s === 'CONFIRMADA' || s === 'EN_ESTADIA';
  }
  canCheckIn() {
    const r = this.data()?.reserva;
    return r?.estado === 'CONFIRMADA' && r.entrada === this.today;
  }
  canCheckOut() {
    return (
      this.data()?.reserva.estado === 'EN_ESTADIA' &&
      cents(this.data()!.financiero.saldoPendiente) === 0
    );
  }
  canCancel() {
    return (
      this.data()?.reserva.estado === 'CONFIRMADA' &&
      cents(this.data()!.financiero.netoCobrado) === 0
    );
  }
  async action(action: 'check-in' | 'check-out' | 'cancelacion' | 'no-presentado') {
    const labels = {
      'check-in': 'Registrar la llegada del huésped',
      'check-out': 'Finalizar la estancia y dejar la habitación en limpieza',
      cancelacion: 'Cancelar esta reserva',
      'no-presentado': 'Marcar esta reserva como no presentado',
    };
    if (!(await this.confirm.ask(labels[action] + '?'))) return;
    this.mutate(this.service.accion(this.id, action));
  }
  mutate(call: Observable<unknown>) {
    this.busy.set(true);
    this.error.set(null);
    this.success.set('');
    call
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: () => {
          this.dialog.set('');
          this.success.set('Operación completada.');
          this.reload();
        },
        error: (e) => this.error.set(apiError(e)),
      });
  }
  show(kind: Dialog, target = 0) {
    const d = this.data();
    if (!d) return;
    this.target = target;
    this.error.set(null);
    this.room.set({
      id: d.reserva.habitacionId,
      label: 'Habitación ' + d.reserva.numeroHabitacion,
    });
    this.serviceChoice.set(null);
    this.form.reset({
      entrada: d.reserva.entrada,
      salida: d.reserva.salida,
      personas: d.reserva.personas,
      cantidad: 1,
      monto: '',
      medio: 'EFECTIVO',
      referencia: '',
      motivo: '',
    });
    this.dialog.set(kind);
  }
  fail(message: string) {
    this.error.set({ message, status: 400, fields: {} });
  }
  submit() {
    const v = this.form.getRawValue(),
      kind = this.dialog(),
      d = this.data();
    if (!d || this.busy()) return;
    if (kind === 'reprogramar') {
      const r = this.room();
      if (
        !r ||
        !validRange(v.entrada, v.salida, true) ||
        !Number.isInteger(v.personas) ||
        v.personas < 1 ||
        v.personas > 20 ||
        (r.capacidad !== undefined && v.personas > r.capacidad)
      ) {
        this.fail('Revisa habitación, fechas y capacidad (1 a 20 personas).');
        return;
      }
      this.mutate(
        this.service.reprogramar(this.id, {
          habitacionId: r.id,
          entrada: v.entrada,
          salida: v.salida,
          personas: v.personas,
        }),
      );
    } else if (kind === 'extender') {
      if (!validDate(v.salida) || v.salida <= d.reserva.salida || v.salida <= this.today) {
        this.fail('La nueva salida debe ser posterior a la salida actual y a hoy.');
        return;
      }
      this.mutate(this.service.extender(this.id, v.salida));
    } else if (kind === 'consumo') {
      if (
        !this.serviceChoice() ||
        !Number.isInteger(v.cantidad) ||
        v.cantidad < 1 ||
        v.cantidad > 10000
      ) {
        this.fail('Elige un servicio y una cantidad entera entre 1 y 10000.');
        return;
      }
      this.mutate(this.service.consumo(this.id, this.serviceChoice()!.id, v.cantidad));
    } else if (kind === 'anular-consumo' || kind === 'anular-pago') {
      const motivo = v.motivo.trim();
      if (!motivo || motivo.length > 255) {
        this.fail('El motivo es obligatorio (máximo 255 caracteres).');
        return;
      }
      this.mutate(
        kind === 'anular-consumo'
          ? this.service.anularConsumo(this.id, this.target, motivo)
          : this.service.anularPago(this.id, this.target, motivo),
      );
    } else if (kind === 'pago' || kind === 'devolucion') {
      const n = cents(v.monto);
      if (n === null || n <= 0) {
        this.fail('Ingresa un monto positivo con hasta dos decimales.');
        return;
      }
      if (
        kind === 'pago' &&
        (n > (cents(d.financiero.saldoPendiente) ?? 0) || v.referencia.trim().length > 150)
      ) {
        this.fail('El monto supera el saldo o la referencia supera 150 caracteres.');
        return;
      }
      if (kind === 'devolucion') {
        const pago = d.pagos.find((p) => p.id === this.target);
        if (
          !pago ||
          n > this.refundable(pago) ||
          !v.motivo.trim() ||
          v.motivo.trim().length > 255
        ) {
          this.fail('Revisa el monto disponible y un motivo de hasta 255 caracteres.');
          return;
        }
      }
      const p: Pending =
        kind === 'pago'
          ? {
              kind: 'pago',
              reservaId: this.id,
              body: {
                claveOperacion: crypto.randomUUID(),
                monto: n / 100,
                medio: v.medio,
                referencia: nullable(v.referencia),
              },
            }
          : {
              kind: 'devolucion',
              reservaId: this.id,
              pagoId: this.target,
              body: {
                claveOperacion: crypto.randomUUID(),
                monto: n / 100,
                motivo: v.motivo.trim(),
              },
            };
      try {
        this.pendingStore.save(p);
        this.pending.set(p);
        this.sendPending();
      } catch (e) {
        this.error.set(apiError(e));
      }
    }
  }
  refundable(p: Pago) {
    const d = this.data();
    return (
      (cents(p.monto) ?? 0) -
      (d?.devoluciones
        .filter((x) => x.pagoId === p.id)
        .reduce((sum, x) => sum + (cents(x.monto) ?? 0), 0) ?? 0)
    );
  }
  canAnnul(p: Pago) {
    return (
      this.auth.admin() &&
      this.active() &&
      !p.anulado &&
      !this.data()?.devoluciones.some((x) => x.pagoId === p.id)
    );
  }
  sendPending() {
    const p = this.pending();
    if (!p || p.reservaId !== this.id || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    const request: Observable<unknown> =
      p.kind === 'pago'
        ? this.service.pagar(p.reservaId, p.body)
        : this.service.devolver(p.reservaId, p.pagoId, p.body);
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: () => {
          this.pendingStore.clear();
          this.pending.set(null);
          this.dialog.set('');
          this.success.set('Movimiento registrado.');
          this.reload();
        },
        error: (e) => {
          const err = apiError(e);
          if (this.pendingStore.definitive(err.status)) {
            this.pendingStore.clear();
            this.pending.set(null);
            this.dialog.set('');
          } else this.dialog.set('');
          this.error.set(err);
          this.reload();
        },
      });
  }
}
