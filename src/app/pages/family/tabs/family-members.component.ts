import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { FamilyMember } from '../../../core/models/family.model';

@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="members-container">
      <div class="header-section">
        <h2 class="section-title">Membres de la famille</h2>
        <button class="btn-invite" (click)="inviteMember()">
          <span class="btn-icon">➕</span>
          Inviter un membre
        </button>
      </div>

      <!-- Members List -->
      <div class="members-grid" *ngIf="members.length > 0">
        <div class="member-card" *ngFor="let member of members">
          <div class="member-avatar" [style.background]="member.color || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'">
            {{ getInitials(member.nickname || member.username) }}
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.nickname || member.username }}</div>
            <div class="member-email">{{ member.userFullName }}</div>
          </div>
          <div class="member-role" [class]="'role-' + member.role.toLowerCase()">
            {{ getRoleLabel(member.role) }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="members.length === 0">
        <div class="empty-icon">👥</div>
        <p class="empty-text">Aucun membre pour le moment</p>
        <button class="btn-primary" (click)="inviteMember()">
          Inviter le premier membre
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des membres...</p>
      </div>
    </div>
  `,
  styles: [`
    .members-container {
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

    .btn-invite {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
    }

    .btn-invite:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-icon {
      font-size: 1.125rem;
    }

    .members-grid {
      display: grid;
      gap: 1rem;
    }

    .member-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .member-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .member-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .member-info {
      flex: 1;
      min-width: 0;
    }

    .member-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .member-email {
      font-size: 0.875rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .member-role {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .role-admin {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
    }

    .role-parent {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .role-member {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
    }

    .role-child {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
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
      font-size: 1.125rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .btn-primary {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
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
      .members-container {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-invite {
        width: 100%;
        justify-content: center;
      }

      .member-card {
        flex-direction: column;
        text-align: center;
      }

      .member-info {
        text-align: center;
      }

      .member-role {
        width: 100%;
      }
    }
  `]
})
export class FamilyMembersComponent implements OnInit {
  members: FamilyMember[] = [];
  isLoading = true;
  familyId: number | null = null;

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get selected family first, then load members
    this.familyService.selectedFamily$.subscribe(family => {
      if (family?.id) {
        this.familyId = family.id;
        this.loadMembers();
      }
    });
  }

  loadMembers(): void {
    if (!this.familyId) return;

    this.isLoading = true;
    this.familyService.getFamilyMembers(this.familyId).subscribe({
      next: (members) => {
        this.members = members;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement membres', err);
        this.isLoading = false;
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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

  inviteMember(): void {
    this.router.navigate(['/invitations/send']);
  }
}
