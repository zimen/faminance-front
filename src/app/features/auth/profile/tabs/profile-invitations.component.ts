import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DialogService } from '../../../../shared/services/dialog.service';

interface ReceivedInvitation {
  id: number;
  familyName: string;
  familyColor: string;
  inviterName: string;
  role: string;
  sentAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

@Component({
  selector: 'app-profile-invitations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invitations-container">
      <h2 class="section-title">Invitations reçues</h2>

      <!-- Pending Invitations -->
      <div class="invitations-section" *ngIf="pendingInvitations.length > 0">
        <h3 class="subsection-title">En attente de réponse</h3>
        
        <div class="invitations-list">
          <div *ngFor="let invitation of pendingInvitations" class="invitation-card pending">
            <div class="invitation-header">
              <div class="family-icon" [style.background]="invitation.familyColor">
                {{ getInitial(invitation.familyName) }}
              </div>
              <div class="invitation-info">
                <h4 class="invitation-title">{{ invitation.familyName }}</h4>
                <p class="invitation-subtitle">
                  Invitation de <strong>{{ invitation.inviterName }}</strong>
                </p>
                <span class="invitation-role">{{ getRoleLabel(invitation.role) }}</span>
              </div>
            </div>

            <div class="invitation-meta">
              <span class="meta-date">
                📅 {{ invitation.sentAt | date:'dd/MM/yyyy à HH:mm' }}
              </span>
            </div>

            <div class="invitation-actions">
              <button class="btn-accept" (click)="acceptInvitation(invitation)">
                <span class="btn-icon">✓</span>
                Accepter
              </button>
              <button class="btn-decline" (click)="declineInvitation(invitation)">
                <span class="btn-icon">✕</span>
                Refuser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Past Invitations -->
      <div class="invitations-section" *ngIf="pastInvitations.length > 0">
        <h3 class="subsection-title">Historique</h3>
        
        <div class="invitations-list">
          <div *ngFor="let invitation of pastInvitations" class="invitation-card past">
            <div class="invitation-header">
              <div class="family-icon-small" [style.background]="invitation.familyColor">
                {{ getInitial(invitation.familyName) }}
              </div>
              <div class="invitation-info-compact">
                <span class="invitation-family">{{ invitation.familyName }}</span>
                <span class="invitation-status" [class]="'status-' + invitation.status.toLowerCase()">
                  {{ getStatusLabel(invitation.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="allInvitations.length === 0 && !isLoading">
        <div class="empty-icon">📭</div>
        <p class="empty-text">Aucune invitation</p>
        <p class="empty-subtitle">Vous n'avez reçu aucune invitation pour le moment</p>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des invitations...</p>
      </div>
    </div>
  `,
  styles: [`
    .invitations-container {
      padding: 1.5rem;
      max-width: 900px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2rem 0;
    }

    .invitations-section {
      margin-bottom: 2.5rem;
    }

    .subsection-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #475569;
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.875rem;
    }

    .invitations-list {
      display: grid;
      gap: 1rem;
    }

    .invitation-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }

    .invitation-card.pending {
      border-color: #fbbf24;
      background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
    }

    .invitation-card.pending:hover {
      border-color: #f59e0b;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
    }

    .invitation-card.past {
      opacity: 0.7;
    }

    .invitation-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .family-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.5rem;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .family-icon-small {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
      color: white;
      flex-shrink: 0;
    }

    .invitation-info {
      flex: 1;
    }

    .invitation-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }

    .invitation-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0 0 0.5rem 0;
    }

    .invitation-role {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .invitation-info-compact {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .invitation-family {
      font-weight: 600;
      color: #334155;
    }

    .invitation-status {
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-accepted {
      background: #d1fae5;
      color: #065f46;
    }

    .status-declined {
      background: #fee2e2;
      color: #991b1b;
    }

    .invitation-meta {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
    }

    .meta-date {
      font-size: 0.875rem;
      color: #64748b;
    }

    .invitation-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-accept, .btn-decline {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-accept {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
    }

    .btn-accept:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-decline {
      background: white;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }

    .btn-decline:hover {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fca5a5;
    }

    .btn-icon {
      font-size: 1.125rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    .empty-subtitle {
      font-size: 1rem;
      color: #64748b;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .invitations-container {
        padding: 1rem;
      }

      .invitation-actions {
        flex-direction: column;
      }

      .invitation-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ProfileInvitationsComponent implements OnInit {
  allInvitations: ReceivedInvitation[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.isLoading = true;
    
    // TODO: Replace with actual API call
    // Mock data for demonstration
    setTimeout(() => {
      this.allInvitations = [
        // Example: {
        //   id: 1,
        //   familyName: 'Famille Martin',
        //   familyColor: '#6366f1',
        //   inviterName: 'Jean Martin',
        //   role: 'PARENT',
        //   sentAt: new Date(),
        //   status: 'PENDING'
        // }
      ];
      this.isLoading = false;
    }, 500);
  }

  get pendingInvitations(): ReceivedInvitation[] {
    return this.allInvitations.filter(inv => inv.status === 'PENDING');
  }

  get pastInvitations(): ReceivedInvitation[] {
    return this.allInvitations.filter(inv => inv.status !== 'PENDING');
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'PARENT': 'Parent',
      'MEMBER': 'Membre',
      'CHILD': 'Enfant'
    };
    return labels[role] || role;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'DECLINED': 'Refusée'
    };
    return labels[status] || status;
  }

  async acceptInvitation(invitation: ReceivedInvitation): Promise<void> {
    const confirmed = await this.dialogService.confirm(`Accepter l'invitation de ${invitation.familyName} ?`);
    if (!confirmed) return;

    // TODO: Call API to accept invitation
    console.log('Accepting invitation', invitation.id);
    
    // Update local state
    invitation.status = 'ACCEPTED';
    
    // Reload families
    setTimeout(() => {
      this.dialogService.success('✅ Invitation acceptée ! Vous êtes maintenant membre de cette famille.');
      window.location.reload();
    }, 500);
  }

  async declineInvitation(invitation: ReceivedInvitation): Promise<void> {
    const confirmed = await this.dialogService.confirm(`Refuser l'invitation de ${invitation.familyName} ?`);
    if (!confirmed) return;

    // TODO: Call API to decline invitation
    console.log('Declining invitation', invitation.id);
    
    // Update local state
    invitation.status = 'DECLINED';
    
    this.dialogService.info('Invitation refusée');
  }
}
