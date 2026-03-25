import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core/interceptors';
import { AuthService } from './core/services/auth.service';
import { OnboardingService } from './core/services/onboarding.service';
import { FamilyService } from './core/services/family.service';

/**
 * Initialise la liaison entre AuthService et OnboardingService/FamilyService
 * Évite la dépendance circulaire en configurant la relation au démarrage
 */
function initializeAppServices(
  authService: AuthService,
  onboardingService: OnboardingService,
  familyService: FamilyService
): () => void {
  return () => {
    authService.setOnboardingService(onboardingService);
    authService.setFamilyService(familyService);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    importProvidersFrom(FormsModule, ReactiveFormsModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppServices,
      deps: [AuthService, OnboardingService, FamilyService],
      multi: true
    }
  ]
};
