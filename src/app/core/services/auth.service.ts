import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

/**
 * AuthService - Gestion de l'authentification
 * Centralise la connexion, l'inscription, la déconnexion et la gestion de l'utilisateur courant
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {
    this.loadCurrentUser();
  }

  /**
   * Inscription d'un nouveau utilisateur
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Erreur lors de l\'inscription:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Connexion d'un utilisateur
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Erreur lors de la connexion:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.storageService.clearAll();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Récupère les informations de l'utilisateur courant
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storageService.saveUser(user); // Mettre à jour le cache
        }),
        catchError(error => {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
          // Si le token est invalide, déconnecter
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Mise à jour du profil utilisateur
   */
  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, data)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storageService.saveUser(user); // Mettre à jour le cache
        }),
        catchError(error => {
          console.error('Erreur lors de la mise à jour du profil:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Changement de mot de passe
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('Erreur lors du changement de mot de passe:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.storageService.getToken();
  }

  /**
   * Récupère l'utilisateur courant (valeur synchrone)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Charge l'utilisateur courant au démarrage de l'application
   */
  private loadCurrentUser(): void {
    // D'abord, restaurer l'utilisateur depuis localStorage s'il existe
    const cachedUser = this.storageService.getUser();
    if (cachedUser) {
      this.currentUserSubject.next(cachedUser);
    }

    // Ensuite, si authentifié, recharger depuis l'API pour avoir les données à jour
    if (this.isAuthenticated()) {
      this.getCurrentUser().subscribe({
        error: () => {
          // Si erreur, garder le user du cache (pas de déconnexion automatique)
          console.warn('Impossible de charger l\'utilisateur courant depuis l\'API');
        }
      });
    }
  }

  /**
   * Gère la réponse d'authentification (stockage token + user)
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.storageService.saveToken(response.accessToken);
    this.storageService.saveRefreshToken(response.refreshToken);
    this.storageService.saveUser(response.user);
    this.currentUserSubject.next(response.user);
  }

  /**
   * Rafraîchit le token JWT
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storageService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Erreur lors du rafraîchissement du token:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }
}
