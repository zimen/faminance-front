import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, of, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import {
  OnboardingState,
  OnboardingStep,
  OnboardingProgress,
  FamilyQuickSetupRequest,
  FamilyQuickSetupResponse,
  OnboardingStatus
} from '../models/onboarding.model';
import { User, AuthResponse, Category, Transaction, TransactionRequest } from '../models';
import { StorageService } from './storage.service';
import { FamilyService } from './family.service';
import { environment } from '../../../environments/environment';

/**
 * OnboardingService - Gestion du processus d'onboarding
 * Coordonne les étapes d'inscription et de configuration initiale
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly API_URL = environment.apiUrl;
  
  private initialState: OnboardingState = {
    currentStep: 1,
    steps: [
      { step: 1, name: 'register', completed: false, optional: false },
      { step: 2, name: 'family-setup', completed: false, optional: false },
      { step: 3, name: 'categories', completed: false, optional: false },
      { step: 4, name: 'first-transaction', completed: false, optional: true }
    ]
  };

  private onboardingStateSubject = new BehaviorSubject<OnboardingState>(this.loadState());
  public onboardingState$ = this.onboardingStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService,
    private familyService: FamilyService
  ) {}

  /**
   * Charge l'état depuis le localStorage
   */
  private loadState(): OnboardingState {
    const saved = this.storageService.getOnboardingState();
    return saved || this.initialState;
  }

  /**
   * Sauvegarde l'état dans le localStorage
   */
  private saveState(state: OnboardingState): void {
    this.storageService.saveOnboardingState(state);
    this.onboardingStateSubject.next(state);
  }

  /**
   * Obtient l'état actuel
   */
  getCurrentState(): OnboardingState {
    return this.onboardingStateSubject.value;
  }

  // ========== SYNCHRONISATION AVEC LE BACKEND ==========

  /**
   * Récupère le statut d'onboarding depuis le backend
   * Permet de synchroniser l'état entre appareils
   */
  fetchOnboardingStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${this.API_URL}/users/me/onboarding-status`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du statut d\'onboarding:', error);
          // Si l'endpoint n'existe pas encore, retourner un statut par défaut
          return of({
            completed: false,
            currentStep: 1,
            stepsCompleted: {
              accountCreated: true, // Si on peut appeler cet endpoint, le compte existe
              familyCreated: false,
              categoriesAdded: false,
              firstTransactionAdded: false
            }
          });
        })
      );
  }

  /**
   * Synchronise l'état local avec le backend
   * Appelé après login ou au démarrage de l'app si l'utilisateur est authentifié
   */
  syncStateWithBackend(): Observable<OnboardingState> {
    return this.fetchOnboardingStatus().pipe(
      map(backendStatus => {
        const localState = this.getCurrentState();
        const mergedState = this.mergeStates(localState, backendStatus);
        this.saveState(mergedState);
        return mergedState;
      })
    );
  }

  /**
   * Fusionne l'état local et le statut backend
   * Priorise les données backend (source de vérité) tout en conservant les données en cours
   */
  private mergeStates(localState: OnboardingState, backendStatus: OnboardingStatus): OnboardingState {
    // Si le backend indique que l'onboarding est complété
    if (backendStatus.completed) {
      this.storageService.markOnboardingComplete();
      return this.initialState; // Reset l'état car tout est déjà fait
    }

    // Fusionner les étapes complétées
    const mergedSteps = localState.steps.map((step, index) => {
      let completed = step.completed;

      // Vérifier si le backend indique que cette étape est complétée
      switch (index) {
        case 0: // register
          completed = completed || backendStatus.stepsCompleted.accountCreated;
          break;
        case 1: // family-setup
          completed = completed || backendStatus.stepsCompleted.familyCreated;
          break;
        case 2: // categories
          completed = completed || backendStatus.stepsCompleted.categoriesAdded;
          break;
        case 3: // first-transaction
          completed = completed || backendStatus.stepsCompleted.firstTransactionAdded;
          break;
      }

      return { ...step, completed };
    });

    // Utiliser le currentStep le plus avancé
    const currentStep = Math.max(localState.currentStep, backendStatus.currentStep);

    return {
      ...localState,
      currentStep,
      steps: mergedSteps
    };
  }

  /**
   * Reprend l'onboarding là où il a été interrompu
   * Navigue automatiquement vers la bonne étape
   */
  resumeOnboarding(): void {
    this.syncStateWithBackend().subscribe({
      next: (state) => {
        // Si tout est complété, aller au dashboard
        if (this.isOnboardingComplete()) {
          this.router.navigate(['/dashboard']);
          return;
        }

        // Sinon, naviguer vers la prochaine étape non complétée
        const nextIncompleteStep = state.steps.find(s => !s.completed);
        if (nextIncompleteStep) {
          const stepRoutes = ['register', 'family-setup', 'categories', 'first-transaction'];
          this.router.navigate(['/onboarding', stepRoutes[nextIncompleteStep.step - 1]]);
        } else {
          // Toutes les étapes sont complétées, marquer comme terminé
          this.markOnboardingComplete();
          this.router.navigate(['/onboarding/complete']);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la reprise de l\'onboarding:', error);
        // En cas d'erreur, utiliser l'état local
        this.navigateToNextStep();
      }
    });
  }

  // ========== ÉTAPES DU WORKFLOW ==========

  /**
   * ÉTAPE 1 : Inscription (simplifié - email + password)
   */
  completeRegistration(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, { email, password })
      .pipe(
        tap(response => {
          const state = this.getCurrentState();
          state.userData = { email, password };
          state.steps[0].completed = true;
          state.currentStep = 2;
          this.saveState(state);
        }),
        catchError(error => {
          console.error('Erreur lors de l\'inscription:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ÉTAPE 2 : Création famille + mise à jour profil utilisateur
   */
  createFamilyWithUser(firstName: string, familyName: string, nickname?: string): Observable<FamilyQuickSetupResponse> {
    const request: FamilyQuickSetupRequest = {
      familyName,
      userFirstName: firstName,
      userNickname: nickname
    };

    // Utiliser FamilyService pour créer la famille
    // Cela garantit que la famille sera automatiquement sélectionnée
    return this.familyService.createFamilyWithMember(request).pipe(
      tap(response => {
        const state = this.getCurrentState();
        state.familyData = { firstName, familyName, nickname };
        state.steps[1].completed = true;
        state.currentStep = 3;
        this.saveState(state);
      }),
      catchError(error => {
        console.error('Erreur lors de la création de la famille:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ÉTAPE 3 : Ajout des catégories système sélectionnées
   */
  addSystemCategoriesToFamily(familyId: number, categoryIds: number[]): Observable<Category[]> {
    return this.http.post<Category[]>(
      `${this.API_URL}/families/${familyId}/categories/bulk`,
      { systemCategoryIds: categoryIds }
    ).pipe(
      tap(categories => {
        const state = this.getCurrentState();
        state.selectedCategoryIds = categoryIds;
        state.steps[2].completed = true;
        state.currentStep = 4;
        this.saveState(state);
      }),
      catchError(error => {
        console.error('Erreur lors de l\'ajout des catégories:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ÉTAPE 4 : Ajout de la première transaction (optionnel)
   */
  addFirstTransaction(familyId: number, transaction: TransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.API_URL}/families/${familyId}/transactions`,
      transaction
    ).pipe(
      tap(result => {
        const state = this.getCurrentState();
        state.firstTransaction = transaction;
        state.steps[3].completed = true;
        this.saveState(state);
      }),
      catchError(error => {
        console.error('Erreur lors de l\'ajout de la transaction:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les IDs des catégories système recommandées
   */
  getRecommendedCategoryIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_URL}/system-categories/recommended-ids`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des catégories recommandées:', error);
          // Fallback : retourner des IDs par défaut si l'endpoint n'existe pas encore
          return of([1, 2, 3, 4, 5, 10]); // IDs fictifs pour développement
        })
      );
  }

  /**
   * Récupère la progression de l'onboarding
   */
  getProgress(): Observable<OnboardingProgress> {
    return this.http.get<OnboardingProgress>(`${this.API_URL}/users/onboarding-progress`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération de la progression:', error);
          // Fallback : calculer depuis l'état local
          const state = this.getCurrentState();
          return of({
            accountCreated: state.steps[0].completed,
            familyCreated: state.steps[1].completed,
            categoriesConfigured: state.selectedCategoryIds?.length || 0,
            firstTransactionAdded: state.steps[3].completed,
            membersInvited: 0,
            budgetsSet: false,
            revenuesAdded: false
          });
        })
      );
  }

  /**
   * Navigation entre les étapes
   */
  nextStep(): void {
    const state = this.getCurrentState();
    if (state.currentStep < state.steps.length) {
      state.currentStep++;
      this.saveState(state);
    }
  }

  previousStep(): void {
    const state = this.getCurrentState();
    if (state.currentStep > 1) {
      state.currentStep--;
      this.saveState(state);
    }
  }

  skipStep(): void {
    const state = this.getCurrentState();
    const currentStepObj = state.steps[state.currentStep - 1];
    
    if (currentStepObj && currentStepObj.optional) {
      this.nextStep();
    }
  }

  /**
   * Vérifie si l'onboarding est complet
   */
  isOnboardingComplete(): boolean {
    return this.storageService.isOnboardingComplete();
  }

  /**
   * Marque l'onboarding comme terminé
   */
  markOnboardingComplete(): void {
    this.storageService.markOnboardingComplete();
    this.clearOnboardingState();
  }

  /**
   * Navigue vers l'étape suivante appropriée
   */
  navigateToNextStep(): void {
    const state = this.getCurrentState();
    const stepNames = ['register', 'family-setup', 'categories', 'first-transaction', 'complete'];
    
    if (state.currentStep <= stepNames.length) {
      this.router.navigate(['/onboarding', stepNames[state.currentStep - 1]]);
    } else {
      this.router.navigate(['/onboarding/complete']);
    }
  }

  /**
   * Efface l'état d'onboarding
   */
  clearOnboardingState(): void {
    this.storageService.clearOnboardingState();
    this.onboardingStateSubject.next(this.initialState);
  }

  /**
   * Réinitialise l'onboarding (pour dev/test)
   */
  resetOnboarding(): void {
    this.storageService.clearOnboardingState();
    this.storageService.clearOnboardingComplete();
    this.onboardingStateSubject.next(this.initialState);
  }

  /**
   * Obtient le pourcentage de complétion
   */
  getCompletionPercentage(): number {
    const state = this.getCurrentState();
    const completedSteps = state.steps.filter(s => s.completed).length;
    const mandatorySteps = state.steps.filter(s => !s.optional).length;
    return Math.round((completedSteps / mandatorySteps) * 100);
  }
}
