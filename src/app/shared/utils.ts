import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
export function cents(value: string | number): number | null {
  const text = String(value).trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
export const moneyValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const n = cents(c.value as string);
  return n !== null && n > 0 ? null : { monto: true };
};
export const passwordValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  typeof c.value === 'string' &&
  c.value.length >= 8 &&
  new TextEncoder().encode(c.value).length <= 72
    ? null
    : { password: true };
export function limaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31')
    return false;
  const d = new Date(value + 'T12:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export function validRange(a: string, b: string, fromToday = false) {
  return validDate(a) && validDate(b) && a < b && (!fromToday || a >= limaToday());
}
export function plusDays(value: string, days: number) {
  const d = new Date(value + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function nullable(value: string) {
  return value.trim() || null;
}
