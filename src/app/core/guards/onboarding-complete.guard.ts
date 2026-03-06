import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { AuthService } from '../services/auth.service';

/**
 * onboardingCompleteGuard - Protège les routes principales
 * Redirige vers l'onboarding si pas encore complété
 * Synchronise avec le backend pour garantir l'état à jour
 */
export const onboardingCompleteGuard: CanActivateFn = () => {
  const onboardingService = inject(OnboardingService);
  const authService = inject(AuthService);

  // Si l'utilisateur n'est pas connecté, le AuthGuard gérera la redirection
  if (!authService.isAuthenticated()) {
    return true;
  }

  // Si l'onboarding n'est pas complété, reprendre là où on en était
  if (!onboardingService.isOnboardingComplete()) {
    // Synchroniser avec le backend et rediriger vers la bonne étape
    onboardingService.resumeOnboarding();
    return false;
  }

  return true;
};
