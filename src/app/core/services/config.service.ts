import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ConfigService {
  apiUrl = 'http://localhost:8085/api';
  hotelName = 'Hotel · Gestión';
  async load(): Promise<void> {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo leer config.json');
    const data: unknown = await response.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('apiUrl' in data) ||
      typeof data.apiUrl !== 'string'
    )
      throw new Error('Configuración API inválida');
    const url = new URL(data.apiUrl, location.origin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error('URL de API inválida');
    this.apiUrl = url.href.replace(/\/$/, '');
    if ('hotelName' in data && typeof data.hotelName === 'string') this.hotelName = data.hotelName;
  }
  isApi(url: string): boolean {
    try {
      const target = new URL(url, location.origin);
      const base = new URL(this.apiUrl, location.origin);
      return (
        target.origin === base.origin &&
        (target.pathname === base.pathname ||
          target.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/'))
      );
    } catch {
      return false;
    }
  }
}
