import { Component, input, computed } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ApiError } from '../../core/services/errors';
@Component({
  selector: 'app-feedback',
  template: `@if (error()) {
    <div class="error-note mb-4" role="alert">
      {{ error()?.message }}
      @if (fields().length) {
        <ul class="mt-2 list-inside list-disc">
          @for (field of fields(); track field[0]) {
            <li>{{ field[0] }}: {{ field[1] }}</li>
          }
        </ul>
      }
    </div>
  }`,
})
export class Feedback {
  error = input<ApiError | null>(null);
  fields = computed(() => Object.entries(this.error()?.fields ?? {}));
}
@Component({
  selector: 'app-field-error',
  template: `@if (control()?.invalid && (control()?.touched || control()?.dirty)) {
    <span class="mt-1 block text-xs text-red-700" role="status">{{ message() }}</span>
  }`,
})
export class FieldError {
  control = input<AbstractControl | null>(null);
  message = input('Revisa este campo.');
}
@Component({
  selector: 'app-loading',
  template: `<div class="flex items-center gap-3 p-8 text-sm text-slate-500" role="status">
    <span
      class="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700"
    ></span
    >Cargando información…
  </div>`,
})
export class Loading {}
@Component({
  selector: 'app-empty',
  template: `<div class="p-10 text-center">
    <p class="font-medium text-ink">{{ title() }}</p>
    <p class="mt-2 text-sm text-slate-500">{{ description() }}</p>
  </div>`,
})
export class Empty {
  title = input('No hay registros');
  description = input('Prueba otros filtros o registra el primer dato.');
}
