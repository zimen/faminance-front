import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

/**
 * AuthInterceptor - Ajoute le token JWT à toutes les requêtes HTTP
 * Intercepte automatiquement les requêtes et ajoute le header Authorization
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const token = storageService.getToken();

  // Ne pas ajouter le token pour les routes publiques
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  if (token && !isPublicRoute) {
    // Cloner la requête et ajouter le header Authorization
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
