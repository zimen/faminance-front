import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { AuthService } from '../services/auth.service';

/**
 * onboardingGuard - Protège les routes d'onboarding
 * Redirige vers le dashboard si l'onboarding est déjà completé ET l'utilisateur authentifié
 */
export const onboardingGuard: CanActivateFn = () => {
  const onboardingService = inject(OnboardingService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si l'utilisateur est authentifié ET a déjà completé l'onboarding, rediriger vers le dashboard
  if (authService.isAuthenticated() && onboardingService.isOnboardingComplete()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
