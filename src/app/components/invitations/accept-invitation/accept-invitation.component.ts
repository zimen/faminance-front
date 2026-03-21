import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationPublicResponse } from '../../../core/models/invitation.model';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accept-invitation.component.html',
  styleUrl: './accept-invitation.component.css'
})
export class AcceptInvitationComponent implements OnInit {
  token: string | null = null;
  invitation: InvitationPublicResponse | null = null;
  isAuthenticated = false;
  isLoading = true;
  isAccepting = false;
  error: string | null = null;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.error = 'Token d\'invitation manquant';
      this.isLoading = false;
      return;
    }

    // Vérifier si l'utilisateur est authentifié
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Charger les détails de l'invitation (endpoint public)
    this.loadInvitationDetails();
  }

  loadInvitationDetails(): void {
    if (!this.token) return;

    this.invitationService.getPublicInvitationByToken(this.token)
      .pipe(
        tap(invitation => {
          this.invitation = invitation;
          this.isLoading = false;

          // Si l'utilisateur est déjà connecté, on peut accepter directement
          if (this.isAuthenticated) {
            // On pourrait auto-accepter ou laisser l'utilisateur confirmer
            // Ici on laisse le choix avec un bouton
          }
        }),
        catchError(error => {
          this.error = this.getErrorMessage(error);
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Redirige vers la page de connexion avec le token d'invitation
   */
  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { 
        token: this.token,
        returnUrl: `/accept-invitation?token=${this.token}`
      }
    });
  }

  /**
   * Redirige vers la page d'inscription avec le token d'invitation
   */
  goToRegister(): void {
    this.router.navigate(['/register'], {
      queryParams: { 
        token: this.token,
        returnUrl: `/accept-invitation?token=${this.token}`
      }
    });
  }

  /**
   * Accepte l'invitation (utilisateur connecté uniquement)
   */
  acceptInvitation(): void {
    if (!this.token || !this.isAuthenticated) return;

    this.isAccepting = true;
    this.error = null;

    this.invitationService.acceptInvitation(this.token)
      .pipe(
        tap(() => {
          this.success = true;
          this.isAccepting = false;
          
          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }),
        catchError(error => {
          this.error = this.getErrorMessage(error);
          this.isAccepting = false;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Extrait un message d'erreur lisible
   */
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Cette invitation n\'existe pas ou a expiré';
    }
    if (error.status === 400) {
      return error.error?.message || 'Cette invitation n\'est plus valide';
    }
    if (error.status === 409) {
      return 'Vous êtes déjà membre de cette famille';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Obtient la couleur du badge de rôle
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'PARENT': return 'role-parent';
      case 'MEMBER': return 'role-member';
      default: return '';
    }
  }

  /**
   * Traduit le rôle en français
   */
  translateRole(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'PARENT': return 'Parent';
      case 'MEMBER': return 'Membre';
      default: return role;
    }
  }
}
