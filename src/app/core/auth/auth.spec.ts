import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, internalReturn } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { authGuard, adminGuard } from '../guards/auth.guards';
import { ConfigService } from '../services/config.service';
const user = {
  id: 7,
  nombre: 'Prueba',
  correo: 'test@example.test',
  rol: 'ADMIN' as const,
  activo: true,
};
describe('Sesión, permisos e interceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: AuthService;
  let router: Router;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    auth = TestBed.inject(AuthService);
  });
  afterEach(() => {
    http.verify();
    auth.logout();
    vi.useRealTimers();
    sessionStorage.clear();
  });
  function login(expiresIn = 3600) {
    auth.login(' TEST@EXAMPLE.TEST ', 'secret').subscribe();
    const req = http.expectOne('http://localhost:8085/api/auth/login');
    expect(req.request.body.correo).toBe('test@example.test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 'test-token', tipoToken: 'Bearer', expiresIn, usuario: user });
  }
  it('inicia sesión y cierra al expirar', () => {
    vi.useFakeTimers();
    login(2);
    expect(auth.loggedIn()).toBe(true);
    expect(sessionStorage.getItem('hotel.session.v1')).toContain('test-token');
    vi.advanceTimersByTime(2001);
    expect(auth.loggedIn()).toBe(false);
    expect(sessionStorage.getItem('hotel.session.v1')).toBeNull();
  });
  it('envía Bearer solo al origen y prefijo configurados', () => {
    login();
    for (const url of [
      'http://localhost:8085/api/huespedes',
      'https://externo.test/api/huespedes',
      'http://localhost:8085/apifalso/huespedes',
      'http://localhost:8085/uploads/a',
    ]) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        url === 'http://localhost:8085/api/huespedes' ? 'Bearer test-token' : null,
      );
      req.flush({});
    }
  });
  it('un 403 conserva sesión y un 401 la termina', () => {
    login();
    client.get('http://localhost:8085/api/usuarios').subscribe({ error: () => {} });
    http
      .expectOne('http://localhost:8085/api/usuarios')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.loggedIn()).toBe(true);
    client.get('http://localhost:8085/api/auth/me').subscribe({ error: () => {} });
    http
      .expectOne('http://localhost:8085/api/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.loggedIn()).toBe(false);
  });
  it('protege rutas y mantiene el retorno interno', () => {
    const state = { url: '/reservas/4' } as RouterStateSnapshot;
    const denied = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, state),
    );
    expect(router.serializeUrl(denied as ReturnType<Router['createUrlTree']>)).toContain(
      'volver=%2Freservas%2F4',
    );
    login();
    expect(
      TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, state)),
    ).toBe(true);
    expect(
      TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state)),
    ).toBe(true);
  });
  it('impide rol administrativo a recepción', () => {
    auth.login('r@example.test', 'secret').subscribe();
    http
      .expectOne('http://localhost:8085/api/auth/login')
      .flush({ token: 'token', expiresIn: 3600, usuario: { ...user, rol: 'RECEPCIONISTA' } });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/sin-permiso');
  });
  it('rechaza retornos externos y rutas peligrosas', () => {
    for (const url of ['//evil.test', 'https://evil.test', '/\\evil.test', '/login', '/x\ny'])
      expect(internalReturn(url)).toBe('/inicio');
    expect(internalReturn('/reservas/2')).toBe('/reservas/2');
  });
  it('no acepta coincidencias de prefijo de dominio', () => {
    const config = TestBed.inject(ConfigService);
    expect(config.isApi('http://localhost:8085.evil.test/api')).toBe(false);
  });
});
