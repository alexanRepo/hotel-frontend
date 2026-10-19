import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ReporteService } from '../../core/services/domain.services';
import { Caja, Grupo, Agenda, Saldo } from '../../core/models/api.models';
import { apiError, ApiError } from '../../core/services/errors';
import { ListState } from '../../core/services/list-state';
import { Feedback, Loading } from '../../shared/components/feedback';
import { Pagination } from '../../shared/components/pagination';
import { PenPipe, FechaPipe } from '../../shared/pipes/format.pipes';
import { validDate, limaToday } from '../../shared/utils';
@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, RouterLink, Feedback, Loading, Pagination, PenPipe],
  templateUrl: './reportes.page.html',
})
export class ReportesPage {
  private destroy = inject(DestroyRef);
  private service = inject(ReporteService);
  today = limaToday();
  form = new FormGroup({
    desde: new FormControl(this.today.slice(0, 8) + '01', { nonNullable: true }),
    hasta: new FormControl(this.today, { nonNullable: true }),
  });
  fecha = new FormControl(this.today, { nonNullable: true });
  busy = signal(false);
  agendaBusy = signal(false);
  error = signal<ApiError | null>(null);
  agendaError = signal<ApiError | null>(null);
  caja = signal<Caja | null>(null);
  reservas = signal<Grupo[]>([]);
  medios = signal<Grupo[]>([]);
  agenda = signal<Agenda | null>(null);
  saldos = new ListState<Saldo>((q) => this.service.saldos(Number(q['pagina'] ?? 0)));
  constructor() {
    this.load();
    this.loadAgenda();
    this.saldos.load();
  }
  load() {
    const v = this.form.getRawValue();
    if (!validDate(v.desde) || !validDate(v.hasta) || v.desde > v.hasta) {
      this.error.set({ message: 'Revisa el rango de fechas.', fields: {}, status: 400 });
      return;
    }
    this.error.set(null);
    this.caja.set(null);
    this.reservas.set([]);
    this.medios.set([]);
    this.busy.set(true);
    forkJoin({
      caja: this.service.caja(v.desde, v.hasta),
      reservas: this.service.reservas(v.desde, v.hasta),
      medios: this.service.medios(v.desde, v.hasta),
    })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (d) => {
          this.caja.set(d.caja);
          this.reservas.set(d.reservas);
          this.medios.set(d.medios);
        },
        error: (e) => this.error.set(apiError(e)),
      });
  }
  loadAgenda() {
    if (!validDate(this.fecha.value)) {
      this.agendaError.set({ message: 'Fecha no válida.', fields: {}, status: 400 });
      return;
    }
    this.agenda.set(null);
    this.agendaBusy.set(true);
    this.agendaError.set(null);
    this.service
      .agenda(this.fecha.value)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.agendaBusy.set(false)),
      )
      .subscribe({
        next: (d) => this.agenda.set(d),
        error: (e) => this.agendaError.set(apiError(e)),
      });
  }
}
