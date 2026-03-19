import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyService } from '../../../core/services/family.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { StatisticsService } from '../../../core/services/statistics.service';
import { Family } from '../../../core/models/family.model';

@Component({
  selector: 'app-family-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-container">
      <h2 class="section-title">Vue d'ensemble</h2>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Membres</div>
            <div class="stat-value">{{ memberCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Solde du mois</div>
            <div class="stat-value" [class.positive]="monthlyBalance >= 0" [class.negative]="monthlyBalance < 0">
              {{ monthlyBalance | number:'1.2-2' }} €
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Transactions ce mois</div>
            <div class="stat-value">{{ transactionCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-label">Créée le</div>
            <div class="stat-value text-sm">{{ family?.createdAt | date:'dd/MM/yyyy' }}</div>
          </div>
        </div>
      </div>

      <!-- Family Info -->
      <div class="info-section" *ngIf="family">
        <h3 class="subsection-title">Informations de la famille</h3>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Nom :</span>
            <span class="info-value">{{ family.name }}</span>
          </div>
          <div class="info-row" *ngIf="family.description">
            <span class="info-label">Description :</span>
            <span class="info-value">{{ family.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Devise :</span>
            <span class="info-value">{{ family.currency || 'EUR' }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity Placeholder -->
      <div class="activity-section">
        <h3 class="subsection-title">Activité récente</h3>
        <div class="placeholder-box">
          <p class="placeholder-text">📊 Activités récentes à venir...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      padding: 1.5rem;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1.5rem 0;
    }

    .subsection-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-value.positive {
      color: #10b981;
    }

    .stat-value.negative {
      color: #ef4444;
    }

    .stat-value.text-sm {
      font-size: 1.125rem;
    }

    .info-section {
      margin-bottom: 2rem;
    }

    .info-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #475569;
      width: 150px;
      flex-shrink: 0;
    }

    .info-value {
      color: #1e293b;
      flex: 1;
    }

    .activity-section {
      margin-top: 2rem;
    }

    .placeholder-box {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
    }

    .placeholder-text {
      font-size: 1.125rem;
      color: #64748b;
      margin: 0;
    }

    @media (max-width: 768px) {
      .overview-container {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 1rem;
      }

      .info-label {
        width: 120px;
      }
    }
  `]
})
export class FamilyOverviewComponent implements OnInit {
  family: Family | null = null;
  memberCount = 0;
  monthlyBalance = 0;
  transactionCount = 0;

  constructor(
    private familyService: FamilyService,
    private transactionService: TransactionService,
    private statisticsService: StatisticsService
  ) {}

  ngOnInit(): void {
    this.loadOverviewData();
  }

  loadOverviewData(): void {
    // Load family info and then load all dependent data
    this.familyService.selectedFamily$.subscribe(family => {
      if (!family) return;
      
      this.family = family;
      const familyId = family.id;

      // Load member count
      this.familyService.getFamilyMembers(familyId).subscribe({
        next: (members) => {
          this.memberCount = members.length;
        }
      });

      // Load monthly stats
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      this.statisticsService.getMonthlyStatistics(familyId, month, year).subscribe({
        next: (stats: any) => {
          this.monthlyBalance = stats.balance || 0;
          this.transactionCount = stats.transactionCount || 0;
        },
        error: () => {
          // Fallback to transaction list count
          this.transactionService.getTransactions(familyId).subscribe({
            next: (transactions: any) => {
              const currentMonth = transactions.filter((t: any) => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === now.getMonth() && 
                       tDate.getFullYear() === now.getFullYear();
              });
              this.transactionCount = currentMonth.length;
              this.monthlyBalance = currentMonth.reduce((sum: any, t: any) => {
                return sum + (t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount));
              }, 0);
            }
          });
        }
      });
    });
  }
}
