import { Component, input, computed } from '@angular/core';
@Component({
  selector: 'app-badge',
  template: `<span
    class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide"
    [class]="tone()"
    ><span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>{{ label() }}</span
  >`,
})
export class Badge {
  value = input.required<string | boolean>();
  label = computed(() =>
    typeof this.value() === 'boolean'
      ? this.value()
        ? 'Activo'
        : 'Inactivo'
      : String(this.value()).replaceAll('_', ' '),
  );
  tone = computed(() => {
    const v = this.value();
    return v === true || v === 'HABILITADA' || v === 'EN_ESTADIA'
      ? 'bg-teal-50 text-teal-800'
      : v === 'CONFIRMADA'
        ? 'bg-blue-50 text-blue-800'
        : v === 'LIMPIEZA'
          ? 'bg-amber-50 text-amber-800'
          : v === 'FINALIZADA'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-rose-50 text-rose-800';
  });
}
