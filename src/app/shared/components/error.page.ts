import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  template: `<div class="card py-16 text-center">
    <p class="eyebrow">{{ forbidden ? '403' : '404' }}</p>
    <h1 class="mt-3">
      {{ forbidden ? 'No tienes acceso a esta sección' : 'Esta página no existe' }}
    </h1>
    <p class="muted mt-4">
      {{
        forbidden
          ? 'Tu sesión sigue activa. Elige una sección disponible para tu rol.'
          : 'Revisa la dirección o vuelve al inicio.'
      }}
    </p>
    <a class="btn mt-7" routerLink="/inicio">Volver al inicio</a>
  </div>`,
})
export class ErrorPage {
  forbidden = inject(ActivatedRoute).snapshot.data['forbidden'] === true;
}
