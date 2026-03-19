import { Injectable } from '@angular/core';
import { User } from '../models';

/**
 * StorageService - Gestion du stockage local (JWT tokens)
 * Centralise toutes les opérations localStorage pour faciliter les tests et la maintenance
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly SELECTED_FAMILY_KEY = 'selected_family_id';
  private readonly ONBOARDING_STATE_KEY = 'onboarding_state';
  private readonly ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

  /**
   * Sauvegarde le token JWT
   */
  saveToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  /**
   * Récupère le token JWT
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Sauvegarde le refresh token
   */
  saveRefreshToken(token: string): void {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du refresh token:', error);
    }
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la récupération du refresh token:', error);
      return null;
    }
  }

  /**
   * Supprime tous les tokens
   */
  clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression des tokens:', error);
    }
  }

  /**
   * Sauvegarde l'utilisateur courant
   */
  saveUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    }
  }

  /**
   * Récupère l'utilisateur courant
   */
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Supprime l'utilisateur courant
   */
  clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    }
  }

  /**
   * Sauvegarde l'ID de la famille sélectionnée
   */
  saveSelectedFamilyId(familyId: number): void {
    try {
      localStorage.setItem(this.SELECTED_FAMILY_KEY, familyId.toString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la famille sélectionnée:', error);
    }
  }

  /**
   * Récupère l'ID de la famille sélectionnée
   */
  getSelectedFamilyId(): number | null {
    try {
      const id = localStorage.getItem(this.SELECTED_FAMILY_KEY);
      return id ? parseInt(id, 10) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la famille sélectionnée:', error);
      return null;
    }
  }

  /**
   * Supprime l'ID de la famille sélectionnée
   */
  clearSelectedFamilyId(): void {
    try {
      localStorage.removeItem(this.SELECTED_FAMILY_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de la famille sélectionnée:', error);
    }
  }

  /**
   * Sauvegarde l'état de l'onboarding
   */
  saveOnboardingState(state: any): void {
    try {
      localStorage.setItem(this.ONBOARDING_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état onboarding:', error);
    }
  }

  /**
   * Récupère l'état de l'onboarding
   */
  getOnboardingState(): any {
    try {
      const state = localStorage.getItem(this.ONBOARDING_STATE_KEY);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état onboarding:', error);
      return null;
    }
  }

  /**
   * Supprime l'état de l'onboarding
   */
  clearOnboardingState(): void {
    try {
      localStorage.removeItem(this.ONBOARDING_STATE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'état onboarding:', error);
    }
  }

  /**
   * Marque l'onboarding comme terminé
   */
  markOnboardingComplete(): void {
    try {
      localStorage.setItem(this.ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Erreur lors du marquage onboarding complet:', error);
    }
  }

  /**
   * Vérifie si l'onboarding est terminé
   */
  isOnboardingComplete(): boolean {
    try {
      return localStorage.getItem(this.ONBOARDING_COMPLETE_KEY) === 'true';
    } catch (error) {
      console.error('Erreur lors de la vérification onboarding complet:', error);
      return false;
    }
  }

  /**
   * Supprime le flag onboarding complete
   */
  clearOnboardingComplete(): void {
    try {
      localStorage.removeItem(this.ONBOARDING_COMPLETE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du flag onboarding:', error);
    }
  }

  /**
   * Nettoie tout le storage (lors de la déconnexion)
   */
  clearAll(): void {
    this.clearToken();
    this.clearSelectedFamilyId();
    this.clearUser();
    this.clearOnboardingComplete();
    this.clearOnboardingState();
  }
}
