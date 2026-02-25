import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { Invitation, InvitationStatus } from '../../../core/models';

/**
 * InvitationListComponent - Liste des invitations reçues et envoyées
 */
@Component({
  selector: 'app-invitation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './invitation-list.component.html',
  styleUrls: ['./invitation-list.component.css']
})
export class InvitationListComponent implements OnInit {
  receivedInvitations: Invitation[] = [];
  sentInvitations: Invitation[] = [];
  loadingReceived = true;
  loadingSent = true;
  processingInvitation = false;
  successMessage = '';
  errorMessage = '';

  constructor(private invitationService: InvitationService) {}

  ngOnInit(): void {
    this.loadReceivedInvitations();
    this.loadSentInvitations();
  }

  loadReceivedInvitations(): void {
    this.loadingReceived = true;
    this.invitationService.getMyInvitations().subscribe({
      next: invitations => {
        this.receivedInvitations = invitations;
        this.loadingReceived = false;
      },
      error: error => {
        this.loadingReceived = false;
        this.errorMessage = error.message || 'Erreur lors du chargement des invitations';
      }
    });
  }

  loadSentInvitations(): void {
    this.loadingSent = true;
    this.invitationService.getSentInvitations().subscribe({
      next: invitations => {
        this.sentInvitations = invitations;
        this.loadingSent = false;
      },
      error: error => {
        this.loadingSent = false;
        this.errorMessage = error.message || 'Erreur lors du chargement des invitations envoyées';
      }
    });
  }

  acceptInvitation(invitation: Invitation): void {
    this.processingInvitation = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.invitationService.acceptInvitation(invitation.token).subscribe({
      next: () => {
        this.processingInvitation = false;
        this.successMessage = `Vous avez rejoint la famille ${invitation.familyName}`;
        this.loadReceivedInvitations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: error => {
        this.processingInvitation = false;
        this.errorMessage = error.message || 'Erreur lors de l\'acceptation de l\'invitation';
      }
    });
  }

  declineInvitation(invitation: Invitation): void {
    if (confirm(`Refuser l'invitation de ${invitation.familyName} ?`)) {
      this.processingInvitation = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.invitationService.declineInvitation(invitation.token).subscribe({
        next: () => {
          this.processingInvitation = false;
          this.successMessage = 'Invitation refusée';
          this.loadReceivedInvitations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: error => {
          this.processingInvitation = false;
          this.errorMessage = error.message || 'Erreur lors du refus de l\'invitation';
        }
      });
    }
  }

  cancelInvitation(invitation: Invitation): void {
    if (confirm(`Annuler l'invitation envoyée à ${invitation.email} ?`)) {
      this.processingInvitation = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.invitationService.cancelInvitation(invitation.id).subscribe({
        next: () => {
          this.processingInvitation = false;
          this.successMessage = 'Invitation annulée';
          this.loadSentInvitations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: error => {
          this.processingInvitation = false;
          this.errorMessage = error.message || 'Erreur lors de l\'annulation de l\'invitation';
        }
      });
    }
  }

  getStatusLabel(status: InvitationStatus): string {
    const labels: Record<InvitationStatus, string> = {
      [InvitationStatus.PENDING]: 'En attente',
      [InvitationStatus.ACCEPTED]: 'Acceptée',
      [InvitationStatus.DECLINED]: 'Refusée',
      [InvitationStatus.CANCELLED]: 'Annulée',
      [InvitationStatus.EXPIRED]: 'Expirée'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
