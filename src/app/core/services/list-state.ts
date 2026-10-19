import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { Pagina, Query } from '../models/api.models';
import { apiError } from './errors';
export class ListState<T> {
  data = signal<Pagina<T>>({
    contenido: [],
    pagina: 0,
    tamanio: 20,
    totalElementos: 0,
    totalPaginas: 0,
  });
  loading = signal(false);
  error = signal('');
  query: Query = { pagina: 0, tamanio: 20 };
  private requests = new Subject<Query>();
  constructor(fetch: (q: Query) => Observable<Pagina<T>>) {
    this.requests
      .pipe(
        switchMap((q) => {
          this.loading.set(true);
          this.error.set('');
          return fetch(q).pipe(
            catchError((e) => {
              this.error.set(apiError(e).message);
              this.data.set({
                contenido: [],
                pagina: Number(q['pagina'] ?? 0),
                tamanio: Number(q['tamanio'] ?? 20),
                totalElementos: 0,
                totalPaginas: 0,
              });
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((page) => this.data.set(page));
  }
  load(q: Query = {}) {
    this.query = { ...this.query, ...q };
    this.requests.next({ ...this.query });
  }
  page(p: number) {
    this.load({ pagina: p });
  }
}
