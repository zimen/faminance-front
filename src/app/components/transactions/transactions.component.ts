import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetLineService } from '../../core/services/budget-line.service';
import { BudgetInstanceService } from '../../core/services/budget-instance.service';
import { Transaction } from '../../core/models/transaction.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { FamilyService } from '../../core/services/family.service';
import { FamilyMember } from '../../core/models/family.model';
import { BudgetLine } from '../../core/models/budget-line.model';
import { BudgetInstance } from '../../core/models/budget-template.model';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Category[] = [];
  members: FamilyMember[] = [];
  showForm = false;
  editMode = false;
  
  currentTransaction: Transaction = this.getEmptyTransaction();
  
  currentMonth: number;
  currentYear: number;
  monthName: string = '';

  // Budget et lignes budgétaires
  currentBudget: BudgetInstance | null = null;
  availableBudgetLines: Array<BudgetLine & { categoryId: number }> = [];

  // Filtres
  filterType: CategoryType | 'ALL' = 'ALL';
  filterCategoryId: number | 'ALL' = 'ALL';

  CategoryType = CategoryType;

  // ID de la famille sélectionnée
  private selectedFamilyId: number | null = null;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private budgetLineService: BudgetLineService,
    private budgetInstanceService: BudgetInstanceService,
    private familyService: FamilyService,
    private dialogService: DialogService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.monthName = this.getMonthName(this.currentMonth);
  }

  ngOnInit(): void {
    // S'abonner à la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.selectedFamilyId = family.id;
        // Charger toutes les données quand la famille est disponible
        this.loadCategories();
        this.loadMembers();
        this.loadCurrentBudget();
        this.loadTransactions();
      } else {
        this.selectedFamilyId = null;
        // Réinitialiser les données si aucune famille n'est sélectionnée
        this.categories = [];
        this.members = [];
        this.transactions = [];
        this.filteredTransactions = [];
        this.currentBudget = null;
        this.availableBudgetLines = [];
      }
    });
  }

  loadCurrentBudget(): void {
    if (!this.selectedFamilyId) return;

    this.budgetInstanceService.getBudgetByMonth(
      this.selectedFamilyId,
      this.currentMonth,
      this.currentYear
    ).subscribe({
      next: (budget) => {
        this.currentBudget = budget;
        this.loadAvailableBudgetLines();
      },
      error: (err) => {
        // Pas de budget pour ce mois, c'est normal
        this.currentBudget = null;
        this.availableBudgetLines = [];
      }
    });
  }

  loadAvailableBudgetLines(): void {
    if (!this.selectedFamilyId || !this.currentBudget) {
      this.availableBudgetLines = [];
      return;
    }

    // Extraire toutes les lignes de toutes les catégories avec leur categoryId
    this.availableBudgetLines = [];
    if (this.currentBudget.linesByCategory) {
      this.currentBudget.linesByCategory.forEach(category => {
        if (category.lines) {
          // Enrichir chaque ligne avec le categoryId
          const enrichedLines = category.lines.map(line => ({
            ...line,
            categoryId: category.categoryId
          }));
          this.availableBudgetLines.push(...enrichedLines);
        }
      });
    }
  }

  loadCategories(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.categoryService.getCategories(this.selectedFamilyId).subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  loadMembers(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.familyService.getFamilyMembers(this.selectedFamilyId).subscribe({
      next: (members) => {
        this.members = members.filter(m => m.active);
      },
      error: (err) => console.error('Erreur lors du chargement des membres', err)
    });
  }

  loadTransactions(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.transactionService.getTransactionsByMonthAndYear(this.selectedFamilyId, this.currentMonth, this.currentYear)
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.applyFilters();
        },
        error: (err) => console.error('Erreur lors du chargement des transactions', err)
      });
  }

  applyFilters(): void {
    let filtered = [...this.transactions];

    // Filtre par type
    if (this.filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }

    // Filtre par catégorie
    if (this.filterCategoryId !== 'ALL') {
      filtered = filtered.filter(t => t.categoryId === this.filterCategoryId);
    }

    this.filteredTransactions = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterType = 'ALL';
    this.filterCategoryId = 'ALL';
    this.applyFilters();
  }

  openAddForm(): void {
    this.currentTransaction = this.getEmptyTransaction();
    this.editMode = false;
    this.showForm = true;
  }

  editTransaction(transaction: Transaction): void {
    this.currentTransaction = { ...transaction };
    this.editMode = true;
    this.showForm = true;
  }

  saveTransaction(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    if (this.editMode && this.currentTransaction.id) {
      this.transactionService.updateTransaction(this.selectedFamilyId, this.currentTransaction.id, this.currentTransaction as any)
        .subscribe({
          next: () => {
            this.loadTransactions();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.transactionService.createTransaction(this.selectedFamilyId, this.currentTransaction as any)
        .subscribe({
          next: () => {
            this.loadTransactions();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la création', err)
        });
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    const confirmed = await this.dialogService.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?');
    if (!confirmed) return;

    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.transactionService.deleteTransaction(this.selectedFamilyId, id).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Erreur lors de la suppression', err)
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.currentTransaction = this.getEmptyTransaction();
  }

  previousMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadCurrentBudget();
    this.loadTransactions();
  }

  nextMonth(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadCurrentBudget();
    this.loadTransactions();
  }

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  getFilteredCategories(): Category[] {
    return this.categories.filter(c => c.type === this.currentTransaction.type);
  }

  getFilteredBudgetLines(): BudgetLine[] {
    if (!this.currentTransaction.categoryId || this.currentTransaction.categoryId === 0) {
      return [];
    }
    return this.availableBudgetLines.filter(line => line.categoryId === Number(this.currentTransaction.categoryId));
  }

  getBudgetLineDisplay(line: BudgetLine): string {
    const remaining = line.plannedAmount - line.actualAmount;
    return `${line.label} (${remaining.toFixed(2)}€ restants sur ${line.plannedAmount.toFixed(2)}€)`;
  }

  private getEmptyTransaction(): Transaction {
    return {
      description: '',
      amount: 0,
      type: CategoryType.EXPENSE,
      categoryId: 0,
      date: new Date().toISOString().split('T')[0]
    };
  }

  getTotalIncome(): number {
    return this.filteredTransactions
      .filter(t => t.type === CategoryType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpense(): number {
    return this.filteredTransactions
      .filter(t => t.type === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getBalance(): number {
    return this.getTotalIncome() - this.getTotalExpense();
  }
}
