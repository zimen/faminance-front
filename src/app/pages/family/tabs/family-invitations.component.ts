import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { Invitation, InvitationStatus } from '../../../core/models';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-family-invitations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invitations-container">
      <div class="header-section">
        <h2 class="section-title">Invitations</h2>
        <button class="btn-send" (click)="sendInvitation()">
          <span class="btn-icon">📨</span>
          Envoyer une invitation
        </button>
      </div>

      <!-- Messages -->
      <div class="alert alert-success" *ngIf="successMessage">
        {{ successMessage }}
      </div>
      <div class="alert alert-error" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- Invitations reçues -->
      <div class="section-box" *ngIf="receivedInvitations.length > 0 || loadingReceived">
        <h3 class="section-subtitle">Invitations reçues</h3>
        
        <div class="loading" *ngIf="loadingReceived">
          <div class="spinner"></div>
          <p>Chargement des invitations reçues...</p>
        </div>

        <div class="invitations-list" *ngIf="!loadingReceived && receivedInvitations.length > 0">
          <div class="invitation-card" *ngFor="let invitation of receivedInvitations">
            <div class="invitation-content">
              <div class="invitation-header">
                <div class="invitation-title">
                  <span class="family-icon">👨‍👩‍👧‍👦</span>
                  <span class="family-name">{{ invitation.familyName }}</span>
                </div>
                <span class="invitation-status" [class]="'status-' + invitation.status.toLowerCase()">
                  {{ getStatusLabel(invitation.status) }}
                </span>
              </div>
              <div class="invitation-meta">
                <p class="invitation-from">
                  Invité par <strong>{{ invitation.invitedBy }}</strong>
                </p>
                <p class="invitation-role">
                  Rôle proposé: <strong>{{ invitation.proposedRole }}</strong>
                </p>
                <p class="invitation-message" *ngIf="invitation.message">
                  {{ invitation.message }}
                </p>
                <p class="invitation-date">
                  Expire le: {{ formatDate(invitation.expiresAt) }}
                </p>
              </div>
              <div class="invitation-actions" *ngIf="invitation.status === 'PENDING'">
                <button class="btn-accept" (click)="acceptInvitation(invitation)" [disabled]="processingInvitation">
                  <span class="btn-icon">✓</span>
                  Accepter
                </button>
                <button class="btn-decline" (click)="declineInvitation(invitation)" [disabled]="processingInvitation">
                  <span class="btn-icon">✗</span>
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invitations envoyées -->
      <div class="section-box">
        <h3 class="section-subtitle">Invitations envoyées</h3>
        
        <div class="loading" *ngIf="loadingSent">
          <div class="spinner"></div>
          <p>Chargement des invitations envoyées...</p>
        </div>

        <div class="invitations-list" *ngIf="!loadingSent && sentInvitations.length > 0">
          <div class="invitation-card" *ngFor="let invitation of sentInvitations">
            <div class="invitation-content">
              <div class="invitation-header">
                <div class="invitation-email">
                  <span class="email-icon">✉️</span>
                  {{ invitation.email }}
                </div>
                <span class="invitation-status" [class]="'status-' + invitation.status.toLowerCase()">
                  {{ getStatusLabel(invitation.status) }}
                </span>
              </div>
              <div class="invitation-meta">
                <p class="invitation-info">
                  <span class="invitation-role-label">{{ invitation.proposedRole }}</span>
                  <span class="meta-separator">•</span>
                  <span class="invitation-date-small">{{ formatDate(invitation.createdAt) }}</span>
                </p>
                <p class="invitation-date">
                  Expire le: {{ formatDate(invitation.expiresAt) }}
                </p>
              </div>
              <div class="invitation-actions" *ngIf="invitation.status === 'PENDING'">
                <button class="btn-cancel" (click)="cancelInvitation(invitation)" [disabled]="processingInvitation">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loadingSent && sentInvitations.length === 0">
          <div class="empty-icon">📭</div>
          <p class="empty-text">Aucune invitation envoyée</p>
          <p class="empty-subtitle">Invitez des membres à rejoindre votre famille</p>
          <button class="btn-primary" (click)="sendInvitation()">
            Envoyer une invitation
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invitations-container {
      padding: 1.5rem;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .section-box {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-subtitle {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1.25rem 0;
    }

    .btn-send {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }

    .btn-send:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-icon {
      font-size: 1.125rem;
    }

    .invitations-list {
      display: grid;
      gap: 1rem;
    }

    .invitation-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }

    .invitation-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .invitation-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .invitation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .invitation-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .family-icon {
      font-size: 1.5rem;
    }

    .family-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .invitation-email {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .email-icon {
      font-size: 1.25rem;
    }

    .invitation-meta {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .invitation-meta p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .invitation-from,
    .invitation-role {
      font-size: 0.875rem;
      color: #475569;
    }

    .invitation-message {
      font-style: italic;
      background: white;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin-top: 0.25rem !important;
    }

    .invitation-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .invitation-role-label {
      font-weight: 600;
      color: #6366f1;
    }

    .meta-separator {
      color: #cbd5e1;
    }

    .invitation-date {
      font-size: 0.8125rem !important;
      color: #94a3b8 !important;
    }

    .invitation-date-small {
      color: #64748b;
    }

    .invitation-status {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-pending {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
    }

    .status-accepted {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
    }

    .status-declined,
    .status-cancelled {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .status-expired {
      background: #94a3b8;
      color: white;
    }

    .invitation-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .invitation-actions button {
      flex: 1;
      padding: 0.625rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
    }

    .invitation-actions button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-accept {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-accept:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-decline {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .btn-decline:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-cancel {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #cbd5e0;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }

    .empty-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    .empty-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .btn-primary {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    @media (max-width: 768px) {
      .invitations-container {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-send {
        width: 100%;
        justify-content: center;
      }

      .invitation-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .invitation-status {
        align-self: flex-start;
      }

      .invitation-actions {
        flex-direction: column;
      }
    }
  `]
})
export class FamilyInvitationsComponent implements OnInit {
  receivedInvitations: Invitation[] = [];
  sentInvitations: Invitation[] = [];
  loadingReceived = true;
  loadingSent = true;
  processingInvitation = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private invitationService: InvitationService,
    private dialogService: DialogService
  ) {}

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
        this.errorMessage = error.message || 'Erreur lors du chargement des invitations reçues';
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

  async declineInvitation(invitation: Invitation): Promise<void> {
    const confirmed = await this.dialogService.confirm(`Refuser l'invitation de ${invitation.familyName} ?`);
    if (!confirmed) return;

    this.processingInvitation = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.invitationService.declineInvitation(invitation.token).subscribe({
      next: () => {
        this.processingInvitation = false;
        this.dialogService.success('Invitation refusée');
        this.loadReceivedInvitations();
      },
      error: error => {
        this.processingInvitation = false;
        this.errorMessage = error.message || 'Erreur lors du refus de l\'invitation';
      }
    });
  }

  async cancelInvitation(invitation: Invitation): Promise<void> {
    const confirmed = await this.dialogService.confirm(`Annuler l'invitation envoyée à ${invitation.email} ?`);
    if (!confirmed) return;

    this.processingInvitation = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.invitationService.cancelInvitation(invitation.id).subscribe({
      next: () => {
        this.processingInvitation = false;
        this.dialogService.success('Invitation annulée');
        this.loadSentInvitations();
      },
      error: error => {
        this.processingInvitation = false;
        this.errorMessage = error.message || 'Erreur lors de l\'annulation de l\'invitation';
      }
    });
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

  sendInvitation(): void {
    this.router.navigate(['/invitations/send']);
  }
}
