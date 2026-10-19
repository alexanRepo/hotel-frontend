import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Pagina } from '../../core/models/api.models';
import { apiError } from '../../core/services/errors';
import { finalize, Subject, switchMap, catchError, EMPTY, tap } from 'rxjs';
export interface Choice {
  id: number;
  label: string;
  capacidad?: number;
  tarifa?: number;
}
interface Option {
  id: number;
  activo: boolean;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  numero?: string;
  capacidad?: number;
  tarifa?: number;
  tipo?: { nombre: string; capacidad: number; tarifa: number; activo: boolean };
}
@Component({
  selector: 'app-lookup',
  imports: [ReactiveFormsModule],
  template: `<div class="mt-1 rounded-lg border border-slate-200 p-3">
    <p class="mb-2 text-sm font-medium">{{ label() || 'Ningún registro seleccionado' }}</p>
    <div class="flex gap-2">
      @if (kind() === 'huespedes' || kind() === 'habitaciones') {
        <input [formControl]="q" placeholder="Buscar" aria-label="Buscar registro" />
      }
      <button type="button" class="btn-secondary !text-xs" [disabled]="busy()" (click)="load(0)">
        {{ busy() ? 'Cargando…' : 'Elegir' }}
      </button>
    </div>
    @if (error()) {
      <p class="mt-2 text-xs text-red-700" role="alert">{{ error() }}</p>
    }
    @if (data(); as d) {
      <ul class="mt-2 max-h-48 overflow-y-auto">
        @for (o of d.contenido; track o.id) {
          @if (o.activo && o.tipo?.activo !== false) {
            <li>
              <button
                type="button"
                class="w-full rounded p-2 text-left text-sm hover:bg-teal-50"
                (click)="select(o)"
              >
                {{ text(o) }}
              </button>
            </li>
          }
        } @empty {
          <li class="p-2 text-xs">Sin resultados.</li>
        }
      </ul>
      <div class="mt-2 flex justify-between text-xs">
        <button type="button" [disabled]="busy() || d.pagina === 0" (click)="load(d.pagina - 1)">
          Anterior</button
        ><span>{{ d.totalElementos }} registros</span
        ><button
          type="button"
          [disabled]="busy() || d.pagina + 1 >= d.totalPaginas"
          (click)="load(d.pagina + 1)"
        >
          Siguiente
        </button>
      </div>
    }
  </div>`,
})
export class Lookup {
  private destroy = inject(DestroyRef);
  private api = inject(ApiService);
  kind = input.required<string>();
  label = input('');
  chosen = output<Choice>();
  q = new FormControl('', { nonNullable: true });
  data = signal<Pagina<Option> | null>(null);
  busy = signal(false);
  error = signal('');
  private requests = new Subject<number>();
  constructor() {
    this.requests
      .pipe(
        switchMap((pagina) => {
          this.busy.set(true);
          this.error.set('');
          return this.api
            .get<Pagina<Option>>('/' + this.kind(), { q: this.q.value.trim(), pagina, tamanio: 10 })
            .pipe(
              tap((d) => this.data.set(d)),
              catchError((e) => {
                this.data.set(null);
                this.error.set(apiError(e).message);
                return EMPTY;
              }),
              finalize(() => this.busy.set(false)),
            );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe();
  }
  load(pagina: number) {
    this.requests.next(pagina);
  }
  text(o: Option) {
    return (
      o.nombre ??
      (o.numero
        ? `${o.numero} · ${o.tipo?.nombre}`
        : `${o.nombres} ${o.apellidos} · ${o.documento}`)
    );
  }
  select(o: Option) {
    this.chosen.emit({
      id: o.id,
      label: this.text(o),
      capacidad: o.tipo?.capacidad ?? o.capacidad,
      tarifa: o.tipo?.tarifa ?? o.tarifa,
    });
    this.data.set(null);
  }
}
