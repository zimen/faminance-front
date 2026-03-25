import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';
import { Family, FamilyMember, FamilyRequest, FamilyRole, FamilyQuickSetupRequest, FamilyQuickSetupResponse } from '../models';
import { JoinByCodeRequest, JoinByCodeResponse } from '../models/invitation.model';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

/**
 * Interface pour la réponse du backend qui peut inclure la liste des membres
 */
interface FamilyResponse {
  id: number;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  membersCount?: number;
  members?: FamilyMember[];
  myRole: FamilyRole;
  createdAt: string;
  currency?: string;
  joinCode?: string;
}

/**
 * FamilyService - Gestion des familles
 * Gère les opérations CRUD sur les familles, les membres et la sélection de famille active
 */
@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  private readonly API_URL = `${environment.apiUrl}/families`;
  
  private selectedFamilySubject = new BehaviorSubject<Family | null>(null);
  public selectedFamily$ = this.selectedFamilySubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.loadSelectedFamily();
  }

  /**
   * Récupère toutes les familles de l'utilisateur connecté
   */
  getMyFamilies(): Observable<Family[]> {
    return this.http.get<FamilyResponse[]>(this.API_URL)
      .pipe(
        map(families => families.map(f => this.mapFamilyResponse(f))),
        catchError(error => {
          console.error('Erreur lors de la récupération des familles:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère une famille par son ID
   */
  getFamilyById(id: number): Observable<Family> {
    return this.http.get<FamilyResponse>(`${this.API_URL}/${id}`)
      .pipe(
        map(f => this.mapFamilyResponse(f)),
        catchError(error => {
          console.error(`Erreur lors de la récupération de la famille ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mappe la réponse du backend vers le modèle Family
   * Calcule membersCount à partir du tableau members si nécessaire
   */
  private mapFamilyResponse(response: FamilyResponse): Family {
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      color: response.color,
      active: response.active,
      membersCount: response.membersCount ?? response.members?.length ?? 0,
      myRole: response.myRole,
      createdAt: response.createdAt,
      currency: response.currency,
      joinCode: response.joinCode
    };
  }

  /**
   * Crée une nouvelle famille
   */
  createFamily(request: FamilyRequest): Observable<Family> {
    return this.http.post<FamilyResponse>(this.API_URL, request)
      .pipe(
        map(f => this.mapFamilyResponse(f)),
        tap(family => {
          // Sélectionner automatiquement la nouvelle famille
          this.selectFamily(family);
        }),
        catchError(error => {
          console.error('Erreur lors de la création de la famille:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crée une famille avec le premier membre (utilisateur actuel)
   * Endpoint spécifique pour l'onboarding
   */
  createFamilyWithMember(request: FamilyQuickSetupRequest): Observable<FamilyQuickSetupResponse> {
    return this.http.post<FamilyQuickSetupResponse>(`${this.API_URL}/quick-setup`, request)
      .pipe(
        tap(response => {
          // Sélectionner automatiquement la nouvelle famille
          this.selectFamily(response.family);
        }),
        catchError(error => {
          console.error('Erreur lors de la création rapide de la famille:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Met à jour une famille
   * Nécessite le rôle ADMIN
   */
  updateFamily(id: number, request: FamilyRequest): Observable<Family> {
    return this.http.put<FamilyResponse>(`${this.API_URL}/${id}`, request)
      .pipe(
        map(f => this.mapFamilyResponse(f)),
        tap(family => {
          // Si c'est la famille sélectionnée, mettre à jour
          if (this.selectedFamilySubject.value?.id === id) {
            this.selectedFamilySubject.next(family);
          }
        }),
        catchError(error => {
          console.error(`Erreur lors de la mise à jour de la famille ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprime une famille
   * Nécessite le rôle ADMIN
   */
  deleteFamily(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          // Si c'est la famille sélectionnée, la désélectionner
          if (this.selectedFamilySubject.value?.id === id) {
            this.clearSelectedFamily();
          }
        }),
        catchError(error => {
          console.error(`Erreur lors de la suppression de la famille ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère tous les membres d'une famille
   */
  getFamilyMembers(familyId: number): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.API_URL}/${familyId}/members`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des membres de la famille ${familyId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprime un membre d'une famille
   * Nécessite le rôle ADMIN ou PARENT
   */
  removeMember(familyId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${familyId}/members/${memberId}`)
      .pipe(
        tap(() => {
          // Si c'est la famille sélectionnée, rafraîchir le nombre de membres
          if (this.selectedFamilySubject.value?.id === familyId) {
            this.refreshSelectedFamily();
          }
        }),
        catchError(error => {
          console.error(`Erreur lors de la suppression du membre ${memberId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Met à jour le rôle d'un membre
   * Nécessite le rôle ADMIN
   */
  updateMemberRole(familyId: number, memberId: number, role: FamilyRole): Observable<void> {
    return this.http.patch<void>(
      `${this.API_URL}/${familyId}/members/${memberId}/role`, 
      { role }
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la mise à jour du rôle du membre ${memberId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rafraîchit la famille sélectionnée (recharge depuis l'API)
   */
  refreshSelectedFamily(): void {
    const currentFamily = this.selectedFamilySubject.value;
    if (currentFamily) {
      this.getFamilyById(currentFamily.id).subscribe({
        next: family => this.selectedFamilySubject.next(family),
        error: (err) => console.error('Erreur rafraîchissement famille:', err)
      });
    }
  }

  /**
   * Quitte une famille (pour l'utilisateur connecté)
   */
  leaveFamily(familyId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${familyId}/leave`, {})
      .pipe(
        tap(() => {
          // Si c'est la famille sélectionnée, la désélectionner
          if (this.selectedFamilySubject.value?.id === familyId) {
            this.clearSelectedFamily();
          }
        }),
        catchError(error => {
          console.error(`Erreur lors de la sortie de la famille ${familyId}:`, error);
          return throwError(() => error);
        })
      );
  }

  // ========== Gestion de la famille sélectionnée ==========

  /**
   * Sélectionne une famille comme famille active
   */
  selectFamily(family: Family): void {
    this.selectedFamilySubject.next(family);
    this.storageService.saveSelectedFamilyId(family.id);
  }

  /**
   * Récupère la famille sélectionnée (valeur synchrone)
   */
  getSelectedFamily(): Family | null {
    return this.selectedFamilySubject.value;
  }

  /**
   * Désélectionne la famille active
   */
  clearSelectedFamily(): void {
    this.selectedFamilySubject.next(null);
    this.storageService.clearSelectedFamilyId();
  }

  /**
   * Charge la famille sélectionnée au démarrage (depuis localStorage)
   */
  private loadSelectedFamily(): void {
    const familyId = this.storageService.getSelectedFamilyId();
    if (familyId) {
      this.getFamilyById(familyId).subscribe({
        next: family => this.selectedFamilySubject.next(family),
        error: () => {
          // Si erreur, effacer la sélection et charger la première famille disponible
          this.storageService.clearSelectedFamilyId();
          this.loadFirstAvailableFamily();
        }
      });
    } else {
      // Aucune famille sélectionnée, charger la première disponible
      this.loadFirstAvailableFamily();
    }
  }

  /**
   * Charge et sélectionne la première famille disponible
   */
  private loadFirstAvailableFamily(): void {
    this.getMyFamilies().subscribe({
      next: families => {
        if (families.length > 0) {
          // Sélectionner la première famille
          this.selectFamily(families[0]);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des familles:', err);
      }
    });
  }

  /**
   * Initialise le service après une connexion réussie
   * Recharge la famille sélectionnée ou la première disponible
   */
  public initializeAfterLogin(): void {
    console.log('Initialisation du FamilyService après connexion');
    this.loadSelectedFamily();
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique dans la famille sélectionnée
   */
  hasRole(role: FamilyRole): boolean {
    const family = this.getSelectedFamily();
    return family?.myRole === role;
  }

  /**
   * Vérifie si l'utilisateur a au moins le niveau de rôle requis
   * Hiérarchie: ADMIN > PARENT > MEMBER
   */
  hasMinRole(minRole: FamilyRole): boolean {
    const family = this.getSelectedFamily();
    if (!family) return false;

    const roleHierarchy = {
      [FamilyRole.ADMIN]: 3,
      [FamilyRole.PARENT]: 2,
      [FamilyRole.MEMBER]: 1
    };

    return roleHierarchy[family.myRole] >= roleHierarchy[minRole];
  }

  /**
   * Rejoindre une famille avec un code court (ex: AB12-XY34)
   */
  joinFamilyByCode(request: JoinByCodeRequest): Observable<JoinByCodeResponse> {
    return this.http.post<JoinByCodeResponse>(`${this.API_URL}/join`, request)
      .pipe(
        tap(response => {
          // Recharger la liste des familles après avoir rejoint
          this.getMyFamilies().subscribe();
        }),
        catchError(error => {
          console.error('Erreur lors de la tentative de rejoindre la famille:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Régénère le code court d'une famille (réservé ADMIN)
   */
  regenerateJoinCode(familyId: number): Observable<Family> {
    return this.http.post<Family>(`${this.API_URL}/${familyId}/regenerate-join-code`, {})
      .pipe(
        tap(family => {
          // Mettre à jour la famille sélectionnée si c'est celle-ci
          if (this.getSelectedFamily()?.id === familyId) {
            this.selectedFamilySubject.next(family);
          }
        }),
        catchError(error => {
          console.error('Erreur lors de la régénération du code:', error);
          return throwError(() => error);
        })
      );
  }
}
