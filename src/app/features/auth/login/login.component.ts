import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { InvitationPublicResponse } from '../../../core/models/invitation.model';
import { catchError, of } from 'rxjs';

/**
 * LoginComponent - Page de connexion
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  
  // Invitation context
  invitationToken: string | null = null;
  invitationDetails: InvitationPublicResponse | null = null;
  loadingInvitation = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private onboardingService: OnboardingService,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
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
          // Si erreur, on continue simplement sans afficher de contexte
          this.loadingInvitation = false;
          return of(null);
        })
      )
      .subscribe(invitation => {
        this.invitationDetails = invitation;
        this.loadingInvitation = false;
      });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          // Si on vient d'une invitation, rediriger vers l'acceptation
          if (this.invitationToken) {
            this.router.navigate(['/accept-invitation'], {
              queryParams: { token: this.invitationToken }
            });
            return;
          }
          
          // Vérifier si l'onboarding est complété
          if (!this.onboardingService.isOnboardingComplete()) {
            // Reprendre l'onboarding là où il a été interrompu
            this.onboardingService.resumeOnboarding();
          } else {
            // Redirection vers les familles ou le returnUrl
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            this.router.navigate([returnUrl || '/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Email ou mot de passe incorrect';
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
