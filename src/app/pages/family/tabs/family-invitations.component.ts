import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentAt: Date;
}

@Component({
  selector: 'app-family-invitations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invitations-container">
      <div class="header-section">
        <h2 class="section-title">Invitations envoyées</h2>
        <button class="btn-send" (click)="sendInvitation()">
          <span class="btn-icon">📨</span>
          Envoyer une invitation
        </button>
      </div>

      <!-- Invitations List -->
      <div class="invitations-list" *ngIf="invitations.length > 0">
        <div class="invitation-card" *ngFor="let invitation of invitations">
          <div class="invitation-content">
            <div class="invitation-email">
              <span class="email-icon">✉️</span>
              {{ invitation.email }}
            </div>
            <div class="invitation-meta">
              <span class="invitation-role">{{ invitation.role }}</span>
              <span class="meta-separator">•</span>
              <span class="invitation-date">{{ invitation.sentAt | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>
          <div class="invitation-status" [class]="'status-' + invitation.status.toLowerCase()">
            {{ getStatusLabel(invitation.status) }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="invitations.length === 0 && !isLoading">
        <div class="empty-icon">📭</div>
        <p class="empty-text">Aucune invitation envoyée</p>
        <p class="empty-subtitle">Invitez des membres à rejoindre votre famille</p>
        <button class="btn-primary" (click)="sendInvitation()">
          Envoyer une invitation
        </button>
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
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .invitation-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .invitation-content {
      flex: 1;
      min-width: 0;
    }

    .invitation-email {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .email-icon {
      font-size: 1.25rem;
    }

    .invitation-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .invitation-role {
      font-weight: 600;
      color: #6366f1;
    }

    .meta-separator {
      color: #cbd5e1;
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

    .status-declined {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
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
      padding: 3rem;
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

      .invitation-card {
        flex-direction: column;
        align-items: stretch;
      }

      .invitation-status {
        text-align: center;
      }
    }
  `]
})
export class FamilyInvitationsComponent implements OnInit {
  invitations: Invitation[] = [];
  isLoading = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.isLoading = true;
    
    // TODO: Replace with actual API call
    // This is mock data for demonstration
    setTimeout(() => {
      this.invitations = [
        // Example: { id: 1, email: 'john@example.com', role: 'CHILD', status: 'PENDING', sentAt: new Date() }
      ];
      this.isLoading = false;
    }, 500);
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'DECLINED': 'Refusée'
    };
    return labels[status] || status;
  }

  sendInvitation(): void {
    this.router.navigate(['/invitations/send']);
  }
}
