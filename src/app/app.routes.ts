import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guards';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layouts/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Vista general · Hotel',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'reservas/nueva',
        title: 'Nueva reserva · Hotel',
        loadComponent: () => import('./features/reservas/nueva.page').then((m) => m.NuevaPage),
      },
      {
        path: 'disponibilidad',
        title: 'Disponibilidad · Hotel',
        data: { availability: true },
        loadComponent: () => import('./features/reservas/nueva.page').then((m) => m.NuevaPage),
      },
      {
        path: 'reservas',
        title: 'Reservas · Hotel',
        loadComponent: () =>
          import('./features/reservas/reservas.page').then((m) => m.ReservasPage),
      },
      {
        path: 'reservas/:id',
        title: 'Detalle de reserva · Hotel',
        loadComponent: () => import('./features/reservas/detail.page').then((m) => m.DetailPage),
      },
      ...[
        { kind: 'huespedes', title: 'Huéspedes' },
        { kind: 'habitaciones', title: 'Habitaciones' },
        { kind: 'tipos-habitacion', title: 'Tipos de habitación' },
        { kind: 'servicios', title: 'Servicios' },
        { kind: 'usuarios', title: 'Usuarios' },
      ].map((c) => ({
        path: c.kind,
        title: c.title + ' · Hotel',
        data: c,
        canActivate: c.kind === 'usuarios' ? [adminGuard] : [],
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      })),
      {
        path: 'reportes',
        title: 'Reportes · Hotel',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/reportes/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'mi-cuenta',
        title: 'Mi cuenta · Hotel',
        loadComponent: () => import('./features/login/account.page').then((m) => m.AccountPage),
      },
      {
        path: 'sin-permiso',
        loadComponent: () => import('./shared/components/error.page').then((m) => m.ErrorPage),
        data: { forbidden: true },
      },
      {
        path: '**',
        loadComponent: () => import('./shared/components/error.page').then((m) => m.ErrorPage),
      },
    ],
  },
];
