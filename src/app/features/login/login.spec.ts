import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import {
  provideLucideIcons,
  LucideBuilding2,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
} from '@lucide/angular';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/auth/auth.service';
describe('Formulario de login renderizado', () => {
  it('renderiza iconos y etiquetas, valida y envía sin navegación externa', () => {
    const login = vi.fn(() => of({}));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLucideIcons(LucideBuilding2, LucideEye, LucideEyeOff, LucideArrowRight),
        { provide: AuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ volver: '//externo.test' }) },
          },
        },
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('svg').length).toBeGreaterThan(1);
    expect(host.querySelector('input[type="email"]')).not.toBeNull();
    fixture.componentInstance.submit();
    expect(login).not.toHaveBeenCalled();
    fixture.componentInstance.form.setValue({
      correo: 'recepcion@example.test',
      password: 'contraseña-elegida',
    });
    fixture.componentInstance.submit();
    expect(login).toHaveBeenCalledWith('recepcion@example.test', 'contraseña-elegida');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
    host.querySelector<HTMLButtonElement>('button[aria-label="Mostrar contraseña"]')!.click();
    fixture.detectChanges();
    expect(host.querySelector('input[autocomplete="current-password"]')?.getAttribute('type')).toBe(
      'text',
    );
  });
});
