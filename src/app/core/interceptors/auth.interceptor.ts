import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../services/config.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(ConfigService);
  if (!config.isApi(request.url)) return next(request);
  const auth = inject(AuthService);
  const login = new URL(request.url, location.origin).pathname.endsWith('/auth/login');
  const token = login ? null : auth.token();
  const req = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !login)
        auth.logout('expirada');
      return throwError(() => error);
    }),
  );
};
