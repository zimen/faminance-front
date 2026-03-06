/**
 * EXEMPLE D'UTILISATION - Reprise d'onboarding
 * 
 * Ce fichier montre comment utiliser les fonctionnalités de reprise
 * d'onboarding dans différents contextes.
 */

import { Component, OnInit } from '@angular/core';
import { OnboardingService } from '../core/services/onboarding.service';
import { AuthService } from '../core/services/auth.service';

// ========================================
// EXEMPLE 1: Vérifier si l'onboarding est complet au démarrage
// ========================================
@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngIf="!onboardingComplete" class="onboarding-reminder">
      <h3>⚠️ Configuration incomplète</h3>
      <p>Terminez la configuration pour profiter pleinement de l'application.</p>
      <button (click)="resumeOnboarding()">Continuer la configuration</button>
    </div>
  `
})
export class DashboardExampleComponent implements OnInit {
  onboardingComplete = false;

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    // Vérifier si l'onboarding est complété
    this.onboardingComplete = this.onboardingService.isOnboardingComplete();

    // Alternative: s'abonner aux changements d'état
    this.onboardingService.onboardingState$.subscribe(state => {
      const allCompleted = state.steps.every(s => s.completed || s.optional);
      this.onboardingComplete = allCompleted;
    });
  }

  resumeOnboarding(): void {
    // Reprendre l'onboarding là où il a été interrompu
    // Cette méthode synchronise avec le backend et redirige automatiquement
    this.onboardingService.resumeOnboarding();
  }
}

// ========================================
// EXEMPLE 2: Afficher la progression de l'onboarding
// ========================================
@Component({
  selector: 'app-onboarding-progress',
  template: `
    <div class="onboarding-progress">
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="completionPercentage"></div>
      </div>
      <p>{{ completedSteps }}/{{ totalSteps }} étapes complétées ({{ completionPercentage }}%)</p>
    </div>
  `
})
export class OnboardingProgressExampleComponent implements OnInit {
  completionPercentage = 0;
  completedSteps = 0;
  totalSteps = 0;

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    // Synchroniser avec le backend d'abord
    this.onboardingService.syncStateWithBackend().subscribe({
      next: (state) => {
        this.updateProgress(state);
      },
      error: () => {
        // En cas d'erreur, utiliser l'état local
        const state = this.onboardingService.getCurrentState();
        this.updateProgress(state);
      }
    });
  }

  private updateProgress(state: any): void {
    this.completedSteps = state.steps.filter((s: any) => s.completed).length;
    this.totalSteps = state.steps.filter((s: any) => !s.optional).length;
    this.completionPercentage = this.onboardingService.getCompletionPercentage();
  }
}

// ========================================
// EXEMPLE 3: Synchroniser manuellement après une action
// ========================================
@Component({
  selector: 'app-profile-setup'
})
export class ProfileSetupExampleComponent {
  constructor(
    private onboardingService: OnboardingService,
    private authService: AuthService
  ) {}

  onProfileUpdated(): void {
    // Après avoir mis à jour le profil, synchroniser avec le backend
    // pour voir si cela a complété une étape d'onboarding
    this.onboardingService.syncStateWithBackend().subscribe({
      next: (state) => {
        console.log('État onboarding mis à jour:', state);
        
        // Vérifier si l'onboarding est maintenant complet
        if (this.onboardingService.isOnboardingComplete()) {
          console.log('🎉 Onboarding terminé !');
        }
      }
    });
  }
}

// ========================================
// EXEMPLE 4: Récupérer le statut backend directement
// ========================================
@Component({
  selector: 'app-admin-panel'
})
export class AdminPanelExampleComponent {
  constructor(private onboardingService: OnboardingService) {}

  checkUserOnboardingStatus(): void {
    // Récupérer le statut depuis le backend (sans fusion)
    this.onboardingService.fetchOnboardingStatus().subscribe({
      next: (status) => {
        console.log('Statut backend:', status);
        
        if (status.completed) {
          console.log(`Onboarding complété le ${status.completedAt}`);
        } else {
          console.log(`Utilisateur à l'étape ${status.currentStep}`);
          console.log('Étapes complétées:', status.stepsCompleted);
        }
      },
      error: (err) => {
        console.error('Impossible de récupérer le statut:', err);
      }
    });
  }
}

// ========================================
// EXEMPLE 5: Réinitialiser l'onboarding (dev/test)
// ========================================
@Component({
  selector: 'app-dev-tools'
})
export class DevToolsExampleComponent {
  constructor(private onboardingService: OnboardingService) {}

  resetOnboardingForTesting(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser l\'onboarding ?')) {
      this.onboardingService.resetOnboarding();
      console.log('Onboarding réinitialisé');
      
      // Rediriger vers l'étape 1
      this.onboardingService.resumeOnboarding();
    }
  }

  clearOnboardingState(): void {
    this.onboardingService.clearOnboardingState();
    console.log('État d\'onboarding effacé');
  }
}

// ========================================
// EXEMPLE 6: Gestion de la connexion avec sync automatique
// ========================================
@Component({
  selector: 'app-login'
})
export class LoginExampleComponent {
  constructor(
    private authService: AuthService,
    private onboardingService: OnboardingService
  ) {}

  login(email: string, password: string): void {
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Connexion réussie');
        
        // La synchronisation de l'onboarding se fait automatiquement
        // dans AuthService.login() via syncOnboardingAfterAuth()
        
        // Optionnel: s'abonner aux changements pour réagir
        setTimeout(() => {
          const state = this.onboardingService.getCurrentState();
          console.log('État onboarding après login:', state);
        }, 100);
      },
      error: (err) => {
        console.error('Erreur de connexion:', err);
      }
    });
  }
}

// ========================================
// EXEMPLE 7: Afficher l'étape actuelle
// ========================================
@Component({
  selector: 'app-onboarding-breadcrumb',
  template: `
    <div class="breadcrumb">
      <span *ngFor="let step of steps; let i = index" 
            [class.active]="i === currentStep - 1"
            [class.completed]="step.completed">
        {{ step.name }}
      </span>
    </div>
  `
})
export class OnboardingBreadcrumbExampleComponent implements OnInit {
  steps: any[] = [];
  currentStep = 1;

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    this.onboardingService.onboardingState$.subscribe(state => {
      this.steps = state.steps;
      this.currentStep = state.currentStep;
    });
  }
}

// ========================================
// EXEMPLE 8: Vérifier les prérequis d'une étape
// ========================================
@Component({
  selector: 'app-step-guard'
})
export class StepGuardExampleComponent implements OnInit {
  canAccessStep3 = false;

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    const state = this.onboardingService.getCurrentState();
    
    // Vérifier que les étapes précédentes sont complétées
    const step1Complete = state.steps[0]?.completed || false;
    const step2Complete = state.steps[1]?.completed || false;
    
    this.canAccessStep3 = step1Complete && step2Complete;

    if (!this.canAccessStep3) {
      console.log('⚠️ Veuillez compléter les étapes précédentes');
      // Rediriger vers l'étape appropriée
      this.onboardingService.resumeOnboarding();
    }
  }
}

// ========================================
// EXEMPLE 9: Observable de progression
// ========================================
@Component({
  selector: 'app-progress-tracker'
})
export class ProgressTrackerExampleComponent implements OnInit {
  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    // S'abonner aux changements d'état en temps réel
    this.onboardingService.onboardingState$.subscribe(state => {
      console.log('📊 État onboarding mis à jour:', {
        currentStep: state.currentStep,
        steps: state.steps.map(s => ({
          name: s.name,
          completed: s.completed
        })),
        percentage: this.onboardingService.getCompletionPercentage()
      });
    });
  }
}

// ========================================
// EXEMPLE 10: Récupérer la progression détaillée
// ========================================
@Component({
  selector: 'app-detailed-progress'
})
export class DetailedProgressExampleComponent implements OnInit {
  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    this.onboardingService.getProgress().subscribe(progress => {
      console.log('📈 Progression détaillée:', {
        accountCreated: progress.accountCreated,
        familyCreated: progress.familyCreated,
        categoriesConfigured: progress.categoriesConfigured,
        firstTransactionAdded: progress.firstTransactionAdded,
        membersInvited: progress.membersInvited,
        budgetsSet: progress.budgetsSet,
        revenuesAdded: progress.revenuesAdded
      });
    });
  }
}
