import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-pagination',
  template: `<nav
    class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"
    aria-label="Paginación"
  >
    <p>
      {{ total() }} registros ·
      {{ pages() === 0 ? 'Sin páginas' : 'Página ' + (page() + 1) + ' de ' + pages() }}
    </p>
    <div class="flex gap-2">
      <button
        class="btn-secondary !py-2 !text-xs"
        [disabled]="busy() || page() <= 0"
        (click)="change.emit(page() - 1)"
      >
        Anterior</button
      ><button
        class="btn-secondary !py-2 !text-xs"
        [disabled]="busy() || page() + 1 >= pages()"
        (click)="change.emit(page() + 1)"
      >
        Siguiente
      </button>
    </div>
  </nav>`,
})
export class Pagination {
  page = input(0);
  pages = input(0);
  total = input(0);
  busy = input(false);
  change = output<number>();
}
