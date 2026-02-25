import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, timeout, catchError, filter, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { FamilyService } from '../services/family.service';
import { FamilyRole } from '../models';

/**
 * RoleGuard - Protège les routes nécessitant un rôle spécifique
 * Vérifie que l'utilisateur a le rôle minimum requis dans la famille sélectionnée
 * 
 * Utilisation dans les routes:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { minRole: FamilyRole.ADMIN }
 * }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  const requiredRole = route.data['minRole'] as FamilyRole;
  
  if (!requiredRole) {
    console.warn('roleGuard: aucun rôle requis spécifié dans les données de la route');
    return true;
  }

  // Utiliser l'observable pour attendre que la famille soit chargée
  return familyService.selectedFamily$.pipe(
    filter((family): family is NonNullable<typeof family> => family !== null), // Attendre qu'une famille soit chargée
    take(1), // Prendre la première famille non-null
    timeout(5000), // Attendre max 5 secondes
    map(selectedFamily => {
      // Ici, selectedFamily est garantie non-null grâce au filter avec type predicate
      
      // Vérifier le rôle
      const roleHierarchy = {
        [FamilyRole.ADMIN]: 3,
        [FamilyRole.PARENT]: 2,
        [FamilyRole.MEMBER]: 1
      };

      const userRoleLevel = roleHierarchy[selectedFamily.myRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel >= requiredRoleLevel) {
        return true;
      }

      // L'utilisateur n'a pas le rôle requis
      console.warn(`roleGuard: rôle insuffisant. Requis: ${requiredRole}, Actuel: ${selectedFamily.myRole}`);
      router.navigate(['/dashboard']);
      return false;
    }),
    catchError(error => {
      // Timeout ou autre erreur - aucune famille n'a été sélectionnée
      console.warn('roleGuard: timeout - aucune famille sélectionnée', error?.name || error);
      router.navigate(['/families']);
      return of(false);
    })
  );
};

/**
 * Helper pour vérifier si l'utilisateur est ADMIN
 */
export const adminGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, minRole: FamilyRole.ADMIN };
  return roleGuard(route, state);
};

/**
 * Helper pour vérifier si l'utilisateur est au moins PARENT
 */
export const parentGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, minRole: FamilyRole.PARENT };
  return roleGuard(route, state);
};
