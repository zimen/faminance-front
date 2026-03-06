import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';

/**
 * onboardingGuard - Protège les routes d'onboarding
 * Redirige vers le dashboard si l'onboarding est déjà complété
 */
export const onboardingGuard: CanActivateFn = () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  // Si l'utilisateur a déjà complété l'onboarding, rediriger vers le dashboard
  if (onboardingService.isOnboardingComplete()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
