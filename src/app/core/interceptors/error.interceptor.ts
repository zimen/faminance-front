import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * ErrorInterceptor - Gestion centralisée des erreurs HTTP
 * Intercepte les erreurs et effectue des actions appropriées
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur: ${error.error.message}`;
        console.error('Erreur client:', error.error.message);
      } else {
        // Erreur côté serveur
        console.error(`Erreur serveur ${error.status}:`, error.error);

        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Requête invalide';
            break;
          
          case 401:
            // Token invalide ou expiré
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            authService.logout();
            break;
          
          case 403:
            // Permissions insuffisantes
            errorMessage = error.error?.message || 'Accès refusé. Permissions insuffisantes.';
            break;
          
          case 404:
            errorMessage = error.error?.message || 'Ressource non trouvée';
            break;
          
          case 409:
            // Conflit (ex: email déjà utilisé)
            errorMessage = error.error?.message || 'Conflit détecté';
            break;
          
          case 422:
            // Validation échouée
            errorMessage = error.error?.message || 'Données invalides';
            break;
          
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          
          case 503:
            errorMessage = 'Service temporairement indisponible';
            break;
          
          default:
            errorMessage = error.error?.message || `Erreur ${error.status}`;
        }
      }

      // Vous pouvez afficher un toast/notification ici si vous avez un service de notification
      // notificationService.showError(errorMessage);

      // Retourner l'erreur avec un message formaté
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};
