import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ReporteService, ReservaService } from '../../core/services/domain.services';
import { Ocupacion, Reserva, Caja } from '../../core/models/api.models';
import { apiError, ApiError } from '../../core/services/errors';
import { Feedback, Loading, Empty } from '../../shared/components/feedback';
import { Badge } from '../../shared/components/badge';
import { PenPipe, FechaPipe } from '../../shared/pipes/format.pipes';
import { limaToday } from '../../shared/utils';
import { Icon } from '../../shared/components/icon';
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Feedback, Loading, Empty, Badge, PenPipe, FechaPipe, Icon],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private destroy = inject(DestroyRef);
  auth = inject(AuthService);
  private reports = inject(ReporteService);
  private reservas = inject(ReservaService);
  today = limaToday();
  busy = signal(false);
  error = signal<ApiError | null>(null);
  ocupacion = signal<Ocupacion | null>(null);
  caja = signal<Caja | null>(null);
  entradas = signal<Reserva[]>([]);
  salidas = signal<Reserva[]>([]);
  constructor() {
    this.load();
  }
  load() {
    this.busy.set(true);
    this.error.set(null);
    if (this.auth.admin()) {
      forkJoin({
        ocupacion: this.reports.ocupacion(),
        caja: this.reports.caja(this.today, this.today),
        agenda: this.reports.agenda(this.today),
      })
        .pipe(
          takeUntilDestroyed(this.destroy),
          finalize(() => this.busy.set(false)),
        )
        .subscribe({
          next: (d) => {
            this.ocupacion.set(d.ocupacion);
            this.caja.set(d.caja);
            this.entradas.set(d.agenda.entradas);
            this.salidas.set(d.agenda.salidas);
          },
          error: (e) => this.error.set(apiError(e)),
        });
    } else {
      this.reservas
        .list({
          desde: this.today,
          hasta: this.today,
          estado: 'CONFIRMADA',
          pagina: 0,
          tamanio: 10,
        })
        .pipe(
          takeUntilDestroyed(this.destroy),
          finalize(() => this.busy.set(false)),
        )
        .subscribe({
          next: (d) => this.entradas.set(d.contenido),
          error: (e) => this.error.set(apiError(e)),
        });
    }
  }
}
