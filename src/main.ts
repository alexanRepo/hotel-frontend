import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
bootstrapApplication(App, appConfig).catch((error) => {
  console.error('No se pudo iniciar el hotel', error);
  document.body.textContent =
    'No se pudo iniciar el hotel. Revisa public/config.json y vuelve a cargar la página.';
});
