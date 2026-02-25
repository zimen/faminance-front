import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService } from '../../core/services/budget.service';
import { StatisticsService } from '../../core/services/statistics.service';
import { MonthlyStatistics } from '../../core/models/statistics.model';
import { Budget } from '../../core/models/budget.model';
import { FamilyService } from '../../core/services/family.service';
import { Family } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentMonth: number;
  currentYear: number;
  monthName: string = '';
  statistics?: MonthlyStatistics;
  budgets: Budget[] = [];
  loading = true;
  currentFamily?: Family;
  private familySubscription?: Subscription;

  constructor(
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private statisticsService: StatisticsService,
    private familyService: FamilyService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.monthName = this.getMonthName(this.currentMonth);
  }

  ngOnInit(): void {
    // S'abonner aux changements de famille sélectionnée
    this.familySubscription = this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamily = family || undefined;
      if (family) {
        this.loadData(family.id);
      } else {
        console.warn('Aucune famille sélectionnée');
        this.statistics = undefined;
        this.budgets = [];
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.familySubscription?.unsubscribe();
  }

  loadData(familyId: number): void {
    this.loading = true;
    
    this.statisticsService.getMonthlyStatistics(familyId, this.currentMonth, this.currentYear)
      .subscribe({
        next: (stats: any) => {
          this.statistics = stats;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement des statistiques', err);
          this.loading = false;
        }
      });

    this.budgetService.getBudgetsByMonthAndYear(familyId, this.currentMonth, this.currentYear)
      .subscribe({
        next: (budgets: Budget[]) => {
          this.budgets = budgets;
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement des budgets', err);
        }
      });
  }

  previousMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    if (this.currentFamily) {
      this.loadData(this.currentFamily.id);
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    if (this.currentFamily) {
      this.loadData(this.currentFamily.id);
    }
  }

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  getBudgetStatus(budget: Budget): string {
    if (!budget.completionPercentage) return 'info';
    if (budget.completionPercentage > 100) return 'danger';
    if (budget.completionPercentage > 80) return 'warning';
    return 'success';
  }
}
