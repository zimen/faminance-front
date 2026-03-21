import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyService } from '../../../../core/services/family.service';
import { Family } from '../../../../core/models/family.model';

@Component({
  selector: 'app-profile-families',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="families-container">
      <div class="header-section">
        <h2 class="section-title">Mes Familles</h2>
        <div class="header-actions">
          <button class="btn-join" (click)="joinFamily()">
            <span class="btn-icon">🔑</span>
            Rejoindre une famille
          </button>
          <button class="btn-create" (click)="createFamily()">
            <span class="btn-icon">➕</span>
            Créer une famille
          </button>
        </div>
      </div>

      <!-- Families Grid -->
      <div class="families-grid" *ngIf="families.length > 0">
        <div 
          *ngFor="let family of families" 
          class="family-card"
          [class.active]="family.id === selectedFamilyId">
          <div class="family-header">
            <div class="family-icon" [style.background]="family.color">
              {{ getInitial(family.name) }}
            </div>
            <div class="family-badge" [class]="'badge-' + family.myRole.toLowerCase()">
              {{ getRoleLabel(family.myRole) }}
            </div>
          </div>

          <div class="family-body">
            <h3 class="family-name">{{ family.name }}</h3>
            <p class="family-description" *ngIf="family.description">
              {{ family.description }}
            </p>
            <div class="family-meta">
              <span class="meta-item">
                <span class="meta-icon">👥</span>
                {{ family.membersCount }} membres
              </span>
              <span class="meta-item" *ngIf="family.id === selectedFamilyId">
                <span class="meta-icon">✓</span>
                Active
              </span>
            </div>
          </div>

          <div class="family-actions">
            <button 
              class="btn-switch" 
              [class.active]="family.id === selectedFamilyId"
              (click)="switchFamily(family)"
              [disabled]="family.id === selectedFamilyId">
              {{ family.id === selectedFamilyId ? 'Famille active' : 'Activer' }}
            </button>
            <button class="btn-manage" (click)="manageFamily(family.id)">
              Gérer
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="families.length === 0 && !isLoading">
        <div class="empty-icon">🏘️</div>
        <p class="empty-text">Aucune famille</p>
        <p class="empty-subtitle">Créez votre première famille pour commencer</p>
        <button class="btn-primary" (click)="createFamily()">
          Créer une famille
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des familles...</p>
      </div>
    </div>
  `,
  styles: [`
    .families-container {
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

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-join, .btn-create {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-join {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .btn-join:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-create {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    .btn-create:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-icon {
      font-size: 1.125rem;
    }

    .families-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .family-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .family-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-4px);
    }

    .family-card.active {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .family-header {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .family-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.75rem;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .family-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-admin {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
    }

    .badge-parent {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .badge-member {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: white;
    }

    .family-body {
      padding: 1.5rem;
    }

    .family-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .family-description {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .family-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .family-actions {
      display: flex;
      border-top: 1px solid #e2e8f0;
    }

    .btn-switch, .btn-manage {
      flex: 1;
      padding: 1rem;
      border: none;
      background: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .btn-switch {
      color: #6366f1;
      border-right: 1px solid #e2e8f0;
    }

    .btn-switch:hover:not(:disabled) {
      background: #eff6ff;
    }

    .btn-switch.active {
      color: #10b981;
      cursor: default;
    }

    .btn-switch:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-manage {
      color: #64748b;
    }

    .btn-manage:hover {
      background: #f8fafc;
      color: #334155;
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
      .families-container {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
      }

      .btn-join, .btn-create {
        width: 100%;
        justify-content: center;
      }

      .families-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileFamiliesComponent implements OnInit {
  families: Family[] = [];
  selectedFamilyId: number | null = null;
  isLoading = true;

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFamilies();
    
    // Get currently selected family
    this.familyService.selectedFamily$.subscribe(family => {
      this.selectedFamilyId = family?.id || null;
    });
  }

  loadFamilies(): void {
    this.isLoading = true;
    this.familyService.getMyFamilies().subscribe({
      next: (families) => {
        this.families = families;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement familles', err);
        this.isLoading = false;
      }
    });
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Admin',
      'PARENT': 'Parent',
      'MEMBER': 'Membre',
      'CHILD': 'Enfant'
    };
    return labels[role] || role;
  }

  switchFamily(family: Family): void {
    if (family.id !== this.selectedFamilyId) {
      this.familyService.selectFamily(family);
      
      // Reload to update all data
      window.location.reload();
    }
  }

  manageFamily(familyId: number): void {
    this.router.navigate(['/families', familyId]);
  }

  joinFamily(): void {
    this.router.navigate(['/join']);
  }

  createFamily(): void {
    this.router.navigate(['/families/create']);
  }
}
