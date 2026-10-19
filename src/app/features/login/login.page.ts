import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { AuthService, internalReturn } from '../../core/auth/auth.service';
import { ApiError, apiError } from '../../core/services/errors';
import { Feedback, FieldError } from '../../shared/components/feedback';
import { Icon } from '../../shared/components/icon';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Feedback, FieldError, Icon],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private fb = inject(FormBuilder);
  show = signal(false);
  busy = signal(false);
  error = signal<ApiError | null>(null);
  form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required]],
  });
  reason = this.route.snapshot.queryParamMap.get('motivo');
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth
      .login(v.correo, v.password)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () =>
          void this.router.navigateByUrl(
            internalReturn(this.route.snapshot.queryParamMap.get('volver')),
          ),
        error: (e) => this.error.set(apiError(e)),
      });
  }
}
