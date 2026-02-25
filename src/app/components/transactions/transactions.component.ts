import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { Transaction } from '../../core/models/transaction.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { FamilyService } from '../../core/services/family.service';
import { FamilyMember } from '../../core/models/family.model';

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

  // Filtres
  filterType: CategoryType | 'ALL' = 'ALL';
  filterCategoryId: number | 'ALL' = 'ALL';

  CategoryType = CategoryType;

  constructor(
    private transactionService: TransactionService,
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
    this.loadMembers();
    this.loadTransactions();
  }

  loadCategories(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.categoryService.getCategories(family.id).subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  loadMembers(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.familyService.getFamilyMembers(family.id).subscribe({
      next: (members) => {
        this.members = members.filter(m => m.active);
      },
      error: (err) => console.error('Erreur lors du chargement des membres', err)
    });
  }

  loadTransactions(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.transactionService.getTransactionsByMonthAndYear(family.id, this.currentMonth, this.currentYear)
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
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    if (this.editMode && this.currentTransaction.id) {
      this.transactionService.updateTransaction(family.id, this.currentTransaction.id, this.currentTransaction as any)
        .subscribe({
          next: () => {
            this.loadTransactions();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.transactionService.createTransaction(family.id, this.currentTransaction as any)
        .subscribe({
          next: () => {
            this.loadTransactions();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la création', err)
        });
    }
  }

  deleteTransaction(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      const family = this.familyService.getSelectedFamily();
      if (!family) {
        console.error('Aucune famille sélectionnée');
        return;
      }

      this.transactionService.deleteTransaction(family.id, id).subscribe({
        next: () => this.loadTransactions(),
        error: (err) => console.error('Erreur lors de la suppression', err)
      });
    }
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
