import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-step2-family-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step2-family-setup.component.html',
  styleUrls: ['./step2-family-setup.component.css']
})
export class Step2FamilySetupComponent implements OnInit {
  familyForm!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.familyForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      familyName: ['', [Validators.required, Validators.minLength(2)]],
      nickname: [''] // Optionnel
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

  onSubmit(): void {
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

  onBack(): void {
    this.onboardingService.previousStep();
    this.router.navigate(['/onboarding/register']);
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }
}
