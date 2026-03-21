import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { InvitationPublicResponse } from '../../../core/models/invitation.model';
import { catchError, of, switchMap, tap } from 'rxjs';
import { DialogService } from '../../../shared/services/dialog.service';

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

  // Invitation context
  invitationToken: string | null = null;
  invitationDetails: InvitationPublicResponse | null = null;
  loadingInvitation = false;
  acceptingInvitation = false;

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });

    // Détecter si on vient d'une invitation
    this.invitationToken = this.route.snapshot.queryParamMap.get('token');
    
    if (this.invitationToken) {
      this.loadInvitationContext();
    }
  }

  /**
   * Charge les détails de l'invitation pour afficher un message contextualisé
   */
  loadInvitationContext(): void {
    if (!this.invitationToken) return;
    
    this.loadingInvitation = true;
    
    this.invitationService.getPublicInvitationByToken(this.invitationToken)
      .pipe(
        catchError(() => {
          this.loadingInvitation = false;
          return of(null);
        })
      )
      .subscribe(invitation => {
        this.invitationDetails = invitation;
        this.loadingInvitation = false;
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
        // Si on vient d'une invitation, l'accepter automatiquement
        if (this.invitationToken) {
          this.autoAcceptInvitation();
        } else {
          // Sinon, passer à l'étape de configuration de famille
          this.onboardingService.nextStep();
          this.router.navigate(['/onboarding/family-setup']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'inscription.';
      }
    });
  }

  /**
   * Accepte automatiquement l'invitation après l'inscription
   */
  autoAcceptInvitation(): void {
    if (!this.invitationToken) return;

    this.acceptingInvitation = true;

    this.invitationService.acceptInvitation(this.invitationToken)
      .pipe(
        tap(() => {
          // Marquer l'onboarding comme complété (l'utilisateur a rejoint une famille)
          this.onboardingService.markOnboardingComplete();
          this.acceptingInvitation = false;
          this.loading = false;
          // Rediriger vers le dashboard
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('Erreur lors de l\'acceptation automatique:', error);
          // En cas d'erreur, continuer l'onboarding normalement
          this.acceptingInvitation = false;
          this.loading = false;
          this.onboardingService.nextStep();
          this.router.navigate(['/onboarding/family-setup']);
          return of(null);
        })
      )
      .subscribe();
  }

  onGoogleLogin(): void {
    // TODO: Implémenter OAuth Google
    this.dialogService.info('OAuth Google à venir !');
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }
}
