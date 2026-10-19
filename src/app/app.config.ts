import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideLucideIcons,
  LucideLayoutDashboard,
  LucideCalendarDays,
  LucideSearch,
  LucideBedDouble,
  LucideUsers,
  LucideBuilding2,
  LucideCoffee,
  LucideUserCog,
  LucideChartNoAxesCombined,
  LucideMenu,
  LucideX,
  LucideLogOut,
  LucideLogIn,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
  LucideShieldCheck,
  LucideLockKeyhole,
} from '@lucide/angular';
import { routes } from './app.routes';
import { ConfigService } from './core/services/config.service';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideLucideIcons(
      LucideLayoutDashboard,
      LucideCalendarDays,
      LucideSearch,
      LucideBedDouble,
      LucideUsers,
      LucideBuilding2,
      LucideCoffee,
      LucideUserCog,
      LucideChartNoAxesCombined,
      LucideMenu,
      LucideX,
      LucideLogOut,
      LucideLogIn,
      LucideEye,
      LucideEyeOff,
      LucideArrowRight,
      LucideShieldCheck,
      LucideLockKeyhole,
    ),
    provideAppInitializer(() => {
      const config = inject(ConfigService);
      const auth = inject(AuthService);
      return config.load().then(() => auth.restore());
    }),
  ],
};
