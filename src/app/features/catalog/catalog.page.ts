import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ListState } from '../../core/services/list-state';
import { Pagina } from '../../core/models/api.models';
import { apiError, ApiError } from '../../core/services/errors';
import { moneyValidator, passwordValidator, nullable } from '../../shared/utils';
import { Feedback, Loading, Empty, FieldError } from '../../shared/components/feedback';
import { Pagination } from '../../shared/components/pagination';
import { Badge } from '../../shared/components/badge';
import { Modal } from '../../shared/components/modal';
import { Lookup, Choice } from '../../shared/components/lookup';
import { ConfirmService } from '../../shared/components/confirm';
import { finalize } from 'rxjs';
interface Row {
  id: number;
  activo: boolean;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  numero?: string;
  documento?: string;
  correo?: string;
  telefono?: string;
  tipoDocumento?: string;
  descripcion?: string;
  capacidad?: number;
  tarifa?: number;
  precio?: number;
  piso?: number;
  rol?: string;
  estado?: string;
  tipo?: { id: number; nombre: string };
}
import { huespedesFields } from '../huespedes/fields';
import { tiposHabitacionFields } from '../tipos-habitacion/fields';
import { habitacionesFields } from '../habitaciones/fields';
import { serviciosFields } from '../servicios/fields';
import { usuariosFields } from '../usuarios/fields';
import { CatalogField } from './catalog.fields';
const fields: Record<string, CatalogField[]> = {
  huespedes: huespedesFields,
  'tipos-habitacion': tiposHabitacionFields,
  habitaciones: habitacionesFields,
  servicios: serviciosFields,
  usuarios: usuariosFields,
};
@Component({
  selector: 'app-catalog-page',
  imports: [
    ReactiveFormsModule,
    Feedback,
    Loading,
    Empty,
    FieldError,
    Pagination,
    Badge,
    Modal,
    Lookup,
  ],
  templateUrl: './catalog.page.html',
})
export class CatalogPage {
  private destroy = inject(DestroyRef);
  private api = inject(ApiService);
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmService);
  kind = this.route.snapshot.data['kind'] as string;
  title = this.route.snapshot.data['title'] as string;
  fields = fields[this.kind];
  state = new ListState<Row>((q) => this.api.get<Pagina<Row>>('/' + this.kind, q));
  form = new FormGroup<Record<string, FormControl<string>>>({});
  search = new FormControl('', { nonNullable: true });
  open = signal(false);
  editing = signal<Row | null>(null);
  busy = signal(false);
  error = signal<ApiError | null>(null);
  lookupLabel = signal('');
  constructor() {
    for (const f of this.fields) {
      this.form.addControl(
        f.key,
        new FormControl('', {
          nonNullable: true,
          validators: [
            ...(f.required ? [Validators.required, Validators.pattern(/.*\S.*/)] : []),
            ...(f.max ? [Validators.maxLength(f.max)] : []),
            ...(f.type === 'email' ? [Validators.email] : []),
            ...(f.type === 'money' ? [moneyValidator] : []),
            ...(f.type === 'password' ? [passwordValidator] : []),
            ...(f.type === 'number'
              ? [
                  Validators.pattern(f.key === 'piso' ? /^-?\d+$/ : /^\d+$/),
                  Validators.min(f.key === 'piso' ? -10 : 1),
                  Validators.max(f.key === 'capacidad' ? 20 : 200),
                ]
              : []),
          ],
        }),
      );
    }
    this.state.load();
  }
  eventValue(event: Event, previous?: string) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    if (previous !== undefined) select.value = previous;
    return value;
  }
  canWrite() {
    return this.kind === 'huespedes' || this.auth.admin();
  }
  label(r: Row) {
    return r.nombre ?? r.numero ?? `${r.nombres} ${r.apellidos}`;
  }
  secondary(r: Row) {
    return (
      r.documento ??
      r.correo ??
      (r.tipo
        ? `${r.tipo.nombre} · Piso ${r.piso}`
        : r.tarifa !== undefined
          ? `Capacidad ${r.capacidad} · S/ ${r.tarifa.toFixed(2)}`
          : r.precio !== undefined
            ? `S/ ${r.precio.toFixed(2)}`
            : '')
    );
  }
  filter() {
    this.state.load({ q: this.search.value.trim(), pagina: 0 });
  }
  edit(row: Row | null) {
    this.editing.set(row);
    this.error.set(null);
    this.form.reset();
    const data = row as unknown as Record<string, unknown> | null;
    for (const f of this.fields) {
      let value = data?.[f.key];
      if (f.key === 'tipoId') value = row?.tipo?.id;
      this.form.controls[f.key].setValue(
        value === undefined || value === null ? (f.options?.[0] ?? '') : String(value),
      );
    }
    this.lookupLabel.set(row?.tipo?.nombre ?? '');
    this.open.set(true);
  }
  choice(c: Choice) {
    this.form.controls['tipoId'].setValue(String(c.id));
    this.lookupLabel.set(c.label);
  }
  save() {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const rawValues = this.form.getRawValue();
    if (this.kind === 'huespedes') {
      const patterns: Record<string, RegExp> = {
        DNI: /^[0-9]{8}$/,
        CE: /^[A-Za-z0-9]{6,12}$/,
        PASAPORTE: /^[A-Za-z0-9]{5,20}$/,
      };
      if (
        !patterns[rawValues['tipoDocumento']]?.test(rawValues['documento'].trim()) ||
        (rawValues['telefono'].trim() && !/^\+?[0-9]{7,15}$/.test(rawValues['telefono'].trim()))
      ) {
        this.error.set({
          message:
            'Revisa el documento (DNI: 8 dígitos; CE: 6–12; pasaporte: 5–20 alfanuméricos) y teléfono (7–15 dígitos).',
          fields: {},
          status: 400,
        });
        return;
      }
    }
    this.busy.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const body: Record<string, unknown> = {};
    for (const f of this.fields) {
      body[f.key] = ['number', 'money', 'lookup'].includes(f.type)
        ? Number(raw[f.key])
        : f.key === 'password'
          ? raw[f.key]
          : nullable(raw[f.key]);
    }
    const row = this.editing();
    const call = row
      ? this.api.put('/' + this.kind + '/' + row.id, body)
      : this.api.post('/' + this.kind, body);
    call
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.open.set(false);
          this.state.load();
        },
        error: (e) => this.error.set(apiError(e)),
      });
  }
  async toggle(r: Row) {
    if (this.busy() || (this.kind === 'usuarios' && r.id === this.auth.user()?.id)) return;
    if (!(await this.confirm.ask(`${r.activo ? 'Desactivar' : 'Activar'} ${this.label(r)}?`)))
      return;
    this.busy.set(true);
    this.api
      .patch('/' + this.kind + '/' + r.id + '/estado', { activo: !r.activo })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({ next: () => this.state.load(), error: (e) => this.error.set(apiError(e)) });
  }
  operativo(r: Row, value: string) {
    if (!['HABILITADA', 'LIMPIEZA', 'MANTENIMIENTO'].includes(value)) return;
    this.busy.set(true);
    this.api
      .patch('/habitaciones/' + r.id + '/operativo', { estado: value })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({ next: () => this.state.load(), error: (e) => this.error.set(apiError(e)) });
  }
  async rol(r: Row, value: string) {
    if (
      this.busy() ||
      r.id === this.auth.user()?.id ||
      !(await this.confirm.ask('Cambiar el rol de ' + this.label(r) + ' a ' + value + '?'))
    )
      return;
    this.busy.set(true);
    this.api
      .patch('/usuarios/' + r.id + '/rol', { rol: value })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({ next: () => this.state.load(), error: (e) => this.error.set(apiError(e)) });
  }
}
