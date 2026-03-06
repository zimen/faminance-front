import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-step1-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step1-register.component.html',
  styleUrls: ['./step1-register.component.css']
})
export class Step1RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.registerForm.value;

    this.onboardingService.completeRegistration(email, password).subscribe({
      next: () => {
        // Passer à l'étape 2
        this.onboardingService.nextStep();
        this.router.navigate(['/onboarding/family-setup']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'inscription.';
      }
    });
  }

  onGoogleLogin(): void {
    // TODO: Implémenter OAuth Google
    alert('OAuth Google à venir !');
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }
}
