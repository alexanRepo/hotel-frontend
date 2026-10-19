import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Login, Usuario } from '../models/api.models';
interface Session {
  token: string;
  expiresAt: number;
  usuario: Usuario;
}
const KEY = 'hotel.session.v1';
export function internalReturn(value: string | null): string {
  return value &&
    /^\/(?![\/])/.test(value) &&
    !value.includes('\\') &&
    !value.startsWith('/login') &&
    !value.startsWith('/sin-permiso') &&
    !/[\r\n]/.test(value)
    ? value
    : '/inicio';
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private session = signal<Session | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  readonly user = computed(() => this.session()?.usuario ?? null);
  readonly admin = computed(() => this.user()?.rol === 'ADMIN');
  constructor() {
    try {
      const s: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
      if (this.valid(s) && s.expiresAt > Date.now()) {
        this.session.set(s);
        this.schedule(s.expiresAt);
      } else sessionStorage.removeItem(KEY);
    } catch {
      sessionStorage.removeItem(KEY);
    }
  }
  private valid(s: unknown): s is Session {
    return (
      !!s &&
      typeof s === 'object' &&
      'token' in s &&
      typeof s.token === 'string' &&
      'expiresAt' in s &&
      typeof s.expiresAt === 'number' &&
      'usuario' in s &&
      !!s.usuario &&
      typeof s.usuario === 'object' &&
      'id' in s.usuario &&
      typeof s.usuario.id === 'number' &&
      'rol' in s.usuario &&
      ['ADMIN', 'RECEPCIONISTA'].includes(String(s.usuario.rol))
    );
  }
  token(): string | null {
    const s = this.session();
    if (s && s.expiresAt <= Date.now()) {
      this.logout('expirada');
      return null;
    }
    return s?.token ?? null;
  }
  loggedIn() {
    return !!this.token();
  }
  login(correo: string, password: string) {
    return this.api
      .post<Login>('/auth/login', { correo: correo.trim().toLowerCase(), password })
      .pipe(
        tap((data) => {
          const expiresAt = Date.now() + data.expiresIn * 1000;
          const s = { token: data.token, expiresAt, usuario: data.usuario };
          sessionStorage.setItem(KEY, JSON.stringify(s));
          this.session.set(s);
          this.schedule(expiresAt);
        }),
      );
  }
  async restore() {
    if (!this.token()) return;
    await firstValueFrom(
      this.api.get<Usuario>('/auth/me').pipe(
        tap((usuario) => {
          const s = this.session();
          if (s) {
            const next = { ...s, usuario };
            sessionStorage.setItem(KEY, JSON.stringify(next));
            this.session.set(next);
          }
        }),
        catchError(() => of(null)),
      ),
    );
  }
  password(actual: string, nueva: string) {
    return this.api
      .put<void>('/auth/password', { actual, nueva })
      .pipe(tap(() => this.logout('password')));
  }
  logout(reason = '') {
    clearTimeout(this.timer);
    this.session.set(null);
    sessionStorage.removeItem(KEY);
    void this.router.navigate(['/login'], { queryParams: reason ? { motivo: reason } : {} });
  }
  private schedule(time: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => this.logout('expirada'),
      Math.min(Math.max(0, time - Date.now()), 2147483647),
    );
  }
}
