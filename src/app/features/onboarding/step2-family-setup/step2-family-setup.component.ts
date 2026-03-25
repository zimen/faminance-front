import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { FamilyService } from '../../../core/services/family.service';
import { JoinByCodeRequest } from '../../../core/models/invitation.model';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-step2-family-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step2-family-setup.component.html',
  styleUrls: ['./step2-family-setup.component.css']
})
export class Step2FamilySetupComponent implements OnInit {
  // Mode de l'interface : 'choice' | 'create' | 'join'
  mode: 'choice' | 'create' | 'join' = 'choice';
  
  familyForm!: FormGroup;
  joinForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Formulaire de création de famille
    this.familyForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      familyName: ['', [Validators.required, Validators.minLength(2)]],
      nickname: [''] // Optionnel
    });

    // Formulaire de jointure par code
    this.joinForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.pattern(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i)
      ]]
    });

    // Charger les données sauvegardées si elles existent
    const state = this.onboardingService.getCurrentState();
    if (state.familyData?.firstName) {
      this.familyForm.patchValue({
        firstName: state.familyData.firstName,
        familyName: state.familyData.familyName,
        nickname: state.familyData.nickname
      });
    }
  }

  // ========== Sélection du mode ==========

  selectCreateMode(): void {
    this.mode = 'create';
    this.errorMessage = '';
    this.successMessage = '';
  }

  selectJoinMode(): void {
    this.mode = 'join';
    this.errorMessage = '';
    this.successMessage = '';
  }

  backToChoice(): void {
    this.mode = 'choice';
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ========== Création de famille ==========

  onSubmitCreate(): void {
    if (this.familyForm.invalid) {
      this.familyForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { firstName, familyName, nickname } = this.familyForm.value;

    this.onboardingService.createFamilyWithUser(firstName, familyName, nickname).subscribe({
      next: (response) => {
        // Passer à l'étape 3
        this.onboardingService.nextStep();
        this.router.navigate(['/onboarding/categories']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la création de la famille.';
      }
    });
  }

  // ========== Jointure par code ==========

  /**
   * Formate le code en temps réel (XXXX-XXXX en majuscules)
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Ajouter le tiret automatiquement après 4 caractères
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    
    this.joinForm.patchValue({ code: value }, { emitEvent: false });
    input.value = value;
  }

  onSubmitJoin(): void {
    if (this.joinForm.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request: JoinByCodeRequest = {
      joinCode: this.joinForm.value.code
    };

    this.familyService.joinFamilyByCode(request)
      .pipe(
        tap(response => {
          this.successMessage = `✅ Vous avez rejoint la famille "${response.name}" !`;
          this.errorMessage = '';
          
          // Marquer l'onboarding comme complet (l'utilisateur a rejoint une famille)
          this.onboardingService.markOnboardingComplete();
          
          // Rediriger vers le dashboard après 1.5 secondes
          setTimeout(() => {
            this.loading = false;
            this.router.navigate(['/dashboard']);
          }, 1500);
        }),
        catchError(error => {
          this.errorMessage = this.getJoinErrorMessage(error);
          this.loading = false;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Extrait un message d'erreur lisible pour la jointure
   */
  private getJoinErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Ce code d\'invitation n\'existe pas ou n\'est plus valide';
    }
    if (error.status === 400) {
      return error.error?.message || 'Le format du code est incorrect';
    }
    if (error.status === 409) {
      return 'Vous êtes déjà membre de cette famille';
    }
    return error.error?.message || 'Une erreur est survenue lors de la jointure';
  }

  // ========== Navigation ==========

  // ========== Navigation ==========

  onBack(): void {
    if (this.mode === 'choice') {
      this.onboardingService.previousStep();
      this.router.navigate(['/onboarding/register']);
    } else {
      this.backToChoice();
    }
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }
}
