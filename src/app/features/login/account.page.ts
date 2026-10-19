import { Component, inject, signal, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, apiError } from '../../core/services/errors';
import { Feedback, FieldError } from '../../shared/components/feedback';
import { passwordValidator } from '../../shared/utils';
@Component({
  imports: [ReactiveFormsModule, Feedback, FieldError],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">Perfil</p>
        <h1>Mi cuenta</h1>
      </div>
    </div>
    <section class="card max-w-xl p-6">
      <h2>{{ auth.user()?.nombre }}</h2>
      <p class="muted mt-2">{{ auth.user()?.correo }} · {{ auth.user()?.rol }}</p>
      <h3 class="mt-7 mb-4">Cambiar contraseña</h3>
      <p class="muted mb-5">
        Al guardar, se cerrará la sesión en los dispositivos con tokens anteriores.
      </p>
      <app-feedback [error]="error()" />
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        <label
          >Contraseña actual<input
            type="password"
            formControlName="actual"
            autocomplete="current-password" /></label
        ><label
          >Nueva contraseña<input
            type="password"
            formControlName="nueva"
            autocomplete="new-password" /><app-field-error
            [control]="form.controls.nueva"
            message="Al menos 8 caracteres y máximo 72 bytes UTF-8." /></label
        ><label
          >Repite la contraseña<input
            type="password"
            formControlName="confirmacion"
            autocomplete="new-password" /></label
        ><button class="btn" [disabled]="busy()">Guardar nueva contraseña</button>
      </form>
    </section>`,
})
export class AccountPage {
  auth = inject(AuthService);
  private destroy = inject(DestroyRef);
  private fb = inject(FormBuilder);
  busy = signal(false);
  error = signal<ApiError | null>(null);
  form = this.fb.nonNullable.group({
    actual: ['', Validators.required],
    nueva: ['', passwordValidator],
    confirmacion: ['', Validators.required],
  });
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const v = this.form.getRawValue();
    if (v.nueva !== v.confirmacion) {
      this.error.set({ message: 'Las contraseñas no coinciden.', fields: {}, status: 400 });
      return;
    }
    this.busy.set(true);
    this.auth
      .password(v.actual, v.nueva)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({ error: (e) => this.error.set(apiError(e)) });
  }
}
