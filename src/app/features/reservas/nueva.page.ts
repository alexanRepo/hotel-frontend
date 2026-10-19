import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HabitacionService, ReservaService } from '../../core/services/domain.services';
import { Habitacion } from '../../core/models/api.models';
import { ListState } from '../../core/services/list-state';
import { apiError, ApiError } from '../../core/services/errors';
import { limaToday, plusDays, validRange, nullable } from '../../shared/utils';
import { Lookup, Choice } from '../../shared/components/lookup';
import { Feedback, Loading, Empty } from '../../shared/components/feedback';
import { Pagination } from '../../shared/components/pagination';
import { PenPipe } from '../../shared/pipes/format.pipes';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-nueva-reserva',
  imports: [ReactiveFormsModule, RouterLink, Lookup, Feedback, Loading, Empty, Pagination, PenPipe],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">Planificación</p>
        <h1>{{ onlyAvailability ? 'Disponibilidad' : 'Nueva reserva' }}</h1>
        <p class="muted">
          Consulta fechas y selecciona una habitación. La tarifa final la calcula el hotel.
        </p>
      </div>
      <a routerLink="/reservas" class="btn-secondary">Ver reservas</a>
    </div>
    <app-feedback [error]="error()" />
    <form [formGroup]="form" (ngSubmit)="search()">
      <div class="card">
        <h2 class="mb-4">01 · Fechas de la estancia</h2>
        <div class="field-grid">
          <label>Entrada<input type="date" formControlName="entrada" [min]="today" /></label
          ><label
            >Salida<input
              type="date"
              formControlName="salida"
              [min]="form.controls.entrada.value" /></label
          ><label>Personas<input type="number" min="1" max="20" formControlName="personas" /></label
          ><label
            >Tipo (opcional)<app-lookup
              kind="tipos-habitacion"
              [label]="tipoLabel()"
              (chosen)="tipo($event)"
            /><button class="text-action mt-2" type="button" (click)="clearTipo()">
              Todos los tipos
            </button></label
          >
        </div>
        <button class="btn mt-5" [disabled]="state.loading()">Buscar habitaciones</button>
      </div>
    </form>
    @if (searched()) {
      <div class="card mt-6">
        <h2>02 · Habitaciones disponibles</h2>
        @if (state.error()) {
          <p class="error-note mt-4">{{ state.error() }}</p>
        }
        @if (state.loading()) {
          <app-loading />
        } @else if (!state.data().contenido.length) {
          <app-empty
            title="Sin disponibilidad"
            description="Selecciona otras fechas o un tipo distinto."
          />
        } @else {
          <div class="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-3">
            @for (r of state.data().contenido; track r.id) {
              <button
                class="rounded-xl border p-5 text-left transition hover:border-teal-600"
                [class.bg-teal-50]="selected()?.id === r.id"
                [class.border-teal-600]="selected()?.id === r.id"
                (click)="select(r)"
              >
                <p class="text-2xl font-semibold">{{ r.numero }}</p>
                <p class="mt-1 text-sm">{{ r.tipo.nombre }} · Piso {{ r.piso }}</p>
                <p class="muted mt-1">Hasta {{ r.tipo.capacidad }} personas</p>
                <p class="mt-4 font-semibold text-teal-700">
                  {{ r.tipo.tarifa | pen }} <span class="font-normal text-xs">/ noche</span>
                </p>
                <p class="text-xs mt-3">
                  {{ selected()?.id === r.id ? '✓ Seleccionada' : 'Seleccionar habitación →' }}
                </p>
              </button>
            }
          </div>
        }
        <app-pagination
          [page]="state.data().pagina"
          [pages]="state.data().totalPaginas"
          [total]="state.data().totalElementos"
          [busy]="state.loading()"
          (change)="state.page($event)"
        />
      </div>
    }
    @if (selected(); as room) {
      <div class="card mt-6">
        <h2>03 · Titular de la reserva</h2>
        <p class="muted mb-4">
          Habitación {{ room.numero }} · {{ form.controls.entrada.value }} a
          {{ form.controls.salida.value }}
        </p>
        <label
          >Huésped<app-lookup
            kind="huespedes"
            [label]="guest()?.label ?? ''"
            (chosen)="guest.set($event)" /></label
        ><a routerLink="/huespedes" class="text-action block mt-2">Registrar un huésped →</a
        ><label class="block mt-5"
          >Observaciones<textarea
            class="mt-1"
            maxlength="500"
            [formControl]="observaciones"
            rows="3"
          ></textarea>
        </label>
        <p class="muted mt-3">
          Se confirmarán las fechas, capacidad y disponibilidad al guardar. No se realiza ningún
          cobro.
        </p>
        <button class="btn mt-5" [disabled]="busy() || !guest()" (click)="save()">
          {{ busy() ? 'Creando…' : 'Confirmar reserva' }}
        </button>
      </div>
    }`,
})
export class NuevaPage {
  private destroy = inject(DestroyRef);
  private rooms = inject(HabitacionService);
  private reservas = inject(ReservaService);
  private router = inject(Router);
  onlyAvailability = inject(ActivatedRoute).snapshot.data['availability'] === true;
  today = limaToday();
  form = new FormGroup({
    entrada: new FormControl(this.today, { nonNullable: true, validators: Validators.required }),
    salida: new FormControl(plusDays(this.today, 1), {
      nonNullable: true,
      validators: Validators.required,
    }),
    personas: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(20),
        Validators.pattern(/^\d+$/),
      ],
    }),
  });
  observaciones = new FormControl('', { nonNullable: true });
  tipoId: number | null = null;
  tipoLabel = signal('');
  selected = signal<Habitacion | null>(null);
  guest = signal<Choice | null>(null);
  busy = signal(false);
  error = signal<ApiError | null>(null);
  searched = signal(false);
  state = new ListState<Habitacion>((q) => this.rooms.disponibles(q));
  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      this.selected.set(null);
      this.searched.set(false);
    });
  }
  tipo(c: Choice) {
    this.tipoId = c.id;
    this.tipoLabel.set(c.label);
    this.selected.set(null);
    this.searched.set(false);
  }
  clearTipo() {
    this.tipoId = null;
    this.tipoLabel.set('');
    this.selected.set(null);
    this.searched.set(false);
  }
  search() {
    const v = this.form.getRawValue();
    if (this.form.invalid || !validRange(v.entrada, v.salida, true)) {
      this.error.set({
        message: 'Elige fechas válidas desde hoy y entre 1 y 20 personas.',
        fields: {},
        status: 400,
      });
      return;
    }
    this.error.set(null);
    this.selected.set(null);
    this.searched.set(true);
    this.state.load({ ...v, tipoId: this.tipoId, pagina: 0 });
  }
  select(r: Habitacion) {
    this.selected.set(r);
  }
  save() {
    if (this.busy()) return;
    const r = this.selected(),
      g = this.guest(),
      v = this.form.getRawValue();
    if (
      !r ||
      !g ||
      this.form.invalid ||
      !validRange(v.entrada, v.salida, true) ||
      v.personas > r.tipo.capacidad
    )
      return;
    this.busy.set(true);
    this.reservas
      .create({
        ...v,
        habitacionId: r.id,
        huespedId: g.id,
        observaciones: nullable(this.observaciones.value),
      })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (r) => void this.router.navigate(['/reservas', r.id]),
        error: (e) => {
          this.error.set(apiError(e));
          if (apiError(e).status === 409) {
            this.selected.set(null);
            this.state.load();
          }
        },
      });
  }
}
