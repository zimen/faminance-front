import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService } from '../../core/services/budget.service';
import { StatisticsService } from '../../core/services/statistics.service';
import { MonthlyStatistics } from '../../core/models/statistics.model';
import { Budget } from '../../core/models/budget.model';
import { Transaction } from '../../core/models/transaction.model';
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
  previousMonthStats?: MonthlyStatistics;
  budgets: Budget[] = [];
  recentTransactions: Transaction[] = [];
  loading = true;
  currentFamily?: Family;
  private familySubscription?: Subscription;
  
  // Variations par rapport au mois précédent
  incomeVariation: number = 0;
  expenseVariation: number = 0;
  balanceVariation: number = 0;

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
    
    // Calculer le mois précédent
    const prevMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
    const prevYear = this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
    
    // Charger toutes les données en parallèle
    forkJoin({
      currentStats: this.statisticsService.getMonthlyStatistics(familyId, this.currentMonth, this.currentYear),
      previousStats: this.statisticsService.getMonthlyStatistics(familyId, prevMonth, prevYear),
      budgets: this.budgetService.getBudgetsByMonthAndYear(familyId, this.currentMonth, this.currentYear),
      transactions: this.transactionService.getTransactions(familyId)
    }).subscribe({
      next: (data) => {
        this.statistics = data.currentStats;
        this.previousMonthStats = data.previousStats;
        this.budgets = data.budgets;
        
        // Trier et limiter aux 10 transactions les plus récentes
        this.recentTransactions = data.transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        // Calculer les variations
        this.calculateVariations();
        
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des données', err);
        this.loading = false;
      }
    });
  }
  
  calculateVariations(): void {
    if (!this.statistics || !this.previousMonthStats) {
      this.incomeVariation = 0;
      this.expenseVariation = 0;
      this.balanceVariation = 0;
      return;
    }
    
    // Calculer les variations en pourcentage
    this.incomeVariation = this.previousMonthStats.totalIncome !== 0 
      ? ((this.statistics.totalIncome - this.previousMonthStats.totalIncome) / this.previousMonthStats.totalIncome) * 100
      : 0;
      
    this.expenseVariation = this.previousMonthStats.totalExpense !== 0
      ? ((this.statistics.totalExpense - this.previousMonthStats.totalExpense) / this.previousMonthStats.totalExpense) * 100
      : 0;
      
    this.balanceVariation = this.previousMonthStats.balance !== 0
      ? ((this.statistics.balance - this.previousMonthStats.balance) / Math.abs(this.previousMonthStats.balance)) * 100
      : 0;
  }
  
  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'F';
  }
  
  getRelativeTime(date: string): string {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffMs = now.getTime() - transactionDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return transactionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
