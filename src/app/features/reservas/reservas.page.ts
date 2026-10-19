import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReservaService } from '../../core/services/domain.services';
import { ListState } from '../../core/services/list-state';
import { Reserva } from '../../core/models/api.models';
import { Badge } from '../../shared/components/badge';
import { Loading, Empty } from '../../shared/components/feedback';
import { Pagination } from '../../shared/components/pagination';
import { FechaPipe, PenPipe } from '../../shared/pipes/format.pipes';
import { validDate } from '../../shared/utils';
@Component({
  selector: 'app-reservas',
  imports: [RouterLink, ReactiveFormsModule, Badge, Loading, Empty, Pagination, FechaPipe, PenPipe],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">Recepción</p>
        <h1>Reservas</h1>
        <p class="muted">Todas las estancias, desde la llegada hasta la salida.</p>
      </div>
      <a routerLink="/reservas/nueva" class="btn">+ Nueva reserva</a>
    </div>
    <div class="card">
      <form class="filter-bar" [formGroup]="form" (ngSubmit)="filter()">
        <label
          >Estado<select formControlName="estado">
            <option value="">Todos</option>
            @for (s of states; track s) {
              <option>{{ s }}</option>
            }
          </select></label
        ><label>Entrada desde<input type="date" formControlName="desde" /></label
        ><label>Hasta<input type="date" formControlName="hasta" /></label
        ><button class="btn-secondary">Filtrar</button>
      </form>
      @if (error() || state.error()) {
        <p class="error-note" role="alert">{{ error() || state.error() }}</p>
      }
      @if (state.loading()) {
        <app-loading />
      } @else if (!state.data().contenido.length) {
        <app-empty />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reserva / huésped</th>
                <th>Habitación</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Alojamiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of state.data().contenido; track r.id) {
                <tr>
                  <td>
                    <a class="text-action" [routerLink]="['/reservas', r.id]">{{ r.codigo }}</a
                    ><span class="block text-xs mt-1"
                      >{{ r.titular.nombres }} {{ r.titular.apellidos }}</span
                    >
                  </td>
                  <td>{{ r.numeroHabitacion }}</td>
                  <td>
                    {{ r.entrada | fecha }} → {{ r.salida | fecha
                    }}<span class="block text-xs text-slate-400"
                      >{{ r.noches }} noches · {{ r.personas }} personas</span
                    >
                  </td>
                  <td><app-badge [value]="r.estado" /></td>
                  <td>{{ r.alojamiento | pen }}</td>
                  <td>
                    <a class="text-action" [routerLink]="['/reservas', r.id]">Ver detalle →</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <app-pagination
        [page]="state.data().pagina"
        [pages]="state.data().totalPaginas"
        [total]="state.data().totalElementos"
        [busy]="state.loading()"
        (change)="state.page($event)"
      />
    </div>`,
})
export class ReservasPage {
  private service = inject(ReservaService);
  state = new ListState<Reserva>((q) => this.service.list(q));
  states = ['CONFIRMADA', 'EN_ESTADIA', 'FINALIZADA', 'CANCELADA', 'NO_PRESENTADO'];
  error = signal('');
  form = new FormGroup({
    estado: new FormControl('', { nonNullable: true }),
    desde: new FormControl('', { nonNullable: true }),
    hasta: new FormControl('', { nonNullable: true }),
  });
  constructor() {
    this.state.load();
  }
  filter() {
    const v = this.form.getRawValue();
    if (
      (v.desde && !validDate(v.desde)) ||
      (v.hasta && !validDate(v.hasta)) ||
      (v.desde && v.hasta && v.desde > v.hasta)
    ) {
      this.error.set('Revisa el rango de fechas.');
      return;
    }
    this.error.set('');
    this.state.load({ ...v, pagina: 0 });
  }
}
