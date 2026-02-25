import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { Budget } from '../../core/models/budget.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { FamilyService } from '../../core/services/family.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  budgets: Budget[] = [];
  categories: Category[] = [];
  showForm = false;
  editMode = false;
  
  currentBudget: Budget = this.getEmptyBudget();
  
  currentMonth: number;
  currentYear: number;
  monthName: string = '';

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private familyService: FamilyService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.monthName = this.getMonthName(this.currentMonth);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBudgets();
  }

  loadCategories(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.categoryService.getCategories(family.id).subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.type === CategoryType.EXPENSE);
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  loadBudgets(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.budgetService.getBudgetsByMonthAndYear(family.id, this.currentMonth, this.currentYear)
      .subscribe({
        next: (budgets: Budget[]) => {
          this.budgets = budgets.sort((a: Budget, b: Budget) => {
            const nameA = a.category?.name || '';
            const nameB = b.category?.name || '';
            return nameA.localeCompare(nameB);
          });
        },
        error: (err: any) => console.error('Erreur lors du chargement des budgets', err)
      });
  }

  openAddForm(): void {
    this.currentBudget = this.getEmptyBudget();
    this.editMode = false;
    this.showForm = true;
  }

  editBudget(budget: Budget): void {
    this.currentBudget = { ...budget };
    this.editMode = true;
    this.showForm = true;
  }

  saveBudget(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.currentBudget.month = this.currentMonth;
    this.currentBudget.year = this.currentYear;

    if (this.editMode && this.currentBudget.id) {
      this.budgetService.updateBudget(family.id, this.currentBudget.id, this.currentBudget as any)
        .subscribe({
          next: () => {
            this.loadBudgets();
            this.closeForm();
          },
          error: (err: any) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.budgetService.createBudget(family.id, this.currentBudget as any)
        .subscribe({
          next: () => {
            this.loadBudgets();
            this.closeForm();
          },
          error: (err: any) => console.error('Erreur lors de la création', err)
        });
    }
  }

  deleteBudget(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      const family = this.familyService.getSelectedFamily();
      if (!family) {
        console.error('Aucune famille sélectionnée');
        return;
      }

      this.budgetService.deleteBudget(family.id, id).subscribe({
        next: () => this.loadBudgets(),
        error: (err: any) => console.error('Erreur lors de la suppression', err)
      });
    }
  }

  recalculateBudgets(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.budgetService.recalculateBudgets(family.id, this.currentMonth, this.currentYear)
      .subscribe({
        next: () => {
          this.loadBudgets();
          alert('Budgets recalculés avec succès');
        },
        error: (err: any) => console.error('Erreur lors du recalcul', err)
      });
  }

  closeForm(): void {
    this.showForm = false;
    this.currentBudget = this.getEmptyBudget();
  }

  previousMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadBudgets();
  }

  nextMonth(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadBudgets();
  }

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  private getEmptyBudget(): Budget {
    return {
      categoryId: 0,
      month: this.currentMonth,
      year: this.currentYear,
      plannedAmount: 0,
      amount: 0,
      period: 'MONTHLY' as any,
      startDate: new Date().toISOString().split('T')[0],
      spent: 0,
      remaining: 0,
      percentage: 0,
      active: true
    };
  }

  getTotalPlanned(): number {
    return this.budgets.reduce((sum, b) => sum + (b.plannedAmount || b.amount ||0), 0);
  }

  getTotalActual(): number {
    return this.budgets.reduce((sum, b) => sum + (b.actualAmount || b.spent || 0), 0);
  }

  getTotalRemaining(): number {
    return this.budgets.reduce((sum, b) => sum + (b.remainingAmount || b.remaining || 0), 0);
  }

  getProgressBarClass(budget: Budget): string {
    const percentage = budget.completionPercentage || budget.percentage || 0;
    if (percentage > 100) return 'over-budget';
    if (percentage > 80) return 'warning';
    return 'normal';
  }

  getProgressBarWidth(budget: Budget): string {
    const percentage = budget.completionPercentage || budget.percentage || 0;
    return Math.min(percentage, 100) + '%';
  }
}
