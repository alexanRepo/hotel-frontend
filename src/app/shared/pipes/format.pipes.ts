import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'pen' })
export class PenPipe implements PipeTransform {
  transform(value: number | null | undefined) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
      value ?? 0,
    );
  }
}
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(value: string | null | undefined) {
    if (!value) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
    const d = new Date(value);
    return isNaN(d.getTime())
      ? '—'
      : new Intl.DateTimeFormat('es-PE', {
          timeZone: 'America/Lima',
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(d);
  }
}
