import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ConfigService } from '../core/services/config.service';
import { Icon } from '../shared/components/icon';
import { limaToday } from '../shared/utils';
import { FechaPipe } from '../shared/pipes/format.pipes';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, FechaPipe],
  templateUrl: './shell.html',
})
export class Shell {
  private media = window.matchMedia('(max-width:1023px)');
  narrow = signal(this.media.matches);
  constructor() {
    const listener = (event: MediaQueryListEvent) => this.narrow.set(event.matches);
    this.media.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change', listener));
  }

  auth = inject(AuthService);
  config = inject(ConfigService);
  mobile = signal(false);
  today = limaToday();
  nav = [
    { url: '/inicio', label: 'Vista general', icon: 'layout-dashboard', admin: false },
    { url: '/reservas', label: 'Reservas', icon: 'calendar-days', admin: false },
    { url: '/disponibilidad', label: 'Disponibilidad', icon: 'search', admin: false },
    { url: '/habitaciones', label: 'Habitaciones', icon: 'bed-double', admin: false },
    { url: '/huespedes', label: 'Huéspedes', icon: 'users', admin: false },
    { url: '/tipos-habitacion', label: 'Tipos de habitación', icon: 'building-2', admin: false },
    { url: '/servicios', label: 'Servicios', icon: 'coffee', admin: false },
    { url: '/usuarios', label: 'Usuarios', icon: 'user-cog', admin: true },
    { url: '/reportes', label: 'Reportes', icon: 'chart-no-axes-combined', admin: true },
  ];
}
