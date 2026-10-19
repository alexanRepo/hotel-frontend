import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import {
  cents,
  moneyValidator,
  passwordValidator,
  limaToday,
  validRange,
  validDate,
} from './utils';
import { FechaPipe } from './pipes/format.pipes';
describe('Fechas e importes de negocio', () => {
  it('convierte decimales a centavos exactos y rechaza formatos ambiguos', () => {
    expect(cents('39.90')).toBe(3990);
    expect(cents('0.10')! + cents('0.20')!).toBe(30);
    for (const v of ['1.001', '1e2', '-5', '1,50', 'NaN', '1000000000000'])
      expect(cents(v)).toBeNull();
    expect(moneyValidator(new FormControl('0'))).not.toBeNull();
  });
  it('respeta el límite de 72 bytes UTF-8 en contraseñas', () => {
    expect(passwordValidator(new FormControl('á'.repeat(36)))).toBeNull();
    expect(passwordValidator(new FormControl('á'.repeat(37)))).not.toBeNull();
    expect(passwordValidator(new FormControl('corta'))).not.toBeNull();
  });
  it('calcula hoy en Lima y no desplaza fechas sin hora', () => {
    expect(limaToday(new Date('2026-10-20T02:00:00Z'))).toBe('2026-10-19');
    expect(new FechaPipe().transform('2026-10-19')).toBe('19/10/2026');
  });
  it('rechaza fechas imposibles y rangos vacíos', () => {
    expect(validDate('2026-02-30')).toBe(false);
    expect(validRange('2026-10-21', '2026-10-21')).toBe(false);
    expect(validRange('2026-10-21', '2026-10-22')).toBe(true);
  });
});
