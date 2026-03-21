import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetInstanceService } from '../../core/services/budget-instance.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetInstance, BudgetCategoryInstance } from '../../core/models/budget-template.model';
import { BudgetLine, BudgetLineRequest } from '../../core/models/budget-line.model';
import { Category, CategoryType } from '../../core/models/category.model';
import { FamilyService } from '../../core/services/family.service';
import { BudgetLineService } from '../../core/services/budget-line.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  budgetInstance: BudgetInstance | null = null;
  categories: Category[] = [];
  
  // Exposer l'enum pour le template
  CategoryType = CategoryType;
  
  // Wizard création budget
  showBudgetWizard = false;
  wizardLines: Array<{ categoryId: number; line: BudgetLineRequest; tempId: string }> = [];
  wizardCurrentLine: BudgetLineRequest & { categoryId: number } = this.getEmptyWizardLine();
  wizardEditingIndex: number | null = null;
  isCreatingBudget = false;
  
  // Gestion des lignes (pour édition budget existant)
  showLineForm = false;
  editingCategoryId: number | null = null;
  editingLineId: number | null = null;
  currentLine: BudgetLineRequest = this.getEmptyLine();
  availableCategoryType: CategoryType | null = null;
  
  currentMonth: number;
  currentYear: number;
  monthName: string = '';

  // ID de la famille sélectionnée
  private selectedFamilyId: number | null = null;

  constructor(
    private budgetInstanceService: BudgetInstanceService,
    private budgetLineService: BudgetLineService,
    private categoryService: CategoryService,
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
        // Charger les données quand la famille est disponible
        this.loadCategories();
        this.loadBudget();
      } else {
        this.selectedFamilyId = null;
        // Réinitialiser les données si aucune famille n'est sélectionnée
        this.categories = [];
        this.budgetInstance = null;
      }
    });
  }

  loadCategories(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.categoryService.getCategories(this.selectedFamilyId).subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.active);
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  loadBudget(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.budgetInstanceService.getBudgetByMonth(
      this.selectedFamilyId,
      this.currentMonth,
      this.currentYear
    ).subscribe({
      next: (budget: BudgetInstance) => {
        this.budgetInstance = budget;
        console.log('Budget chargé:', budget);
      },
      error: (err: any) => {
        // Pas de budget pour ce mois = normal
        console.log('Aucun budget pour ce mois');
        this.budgetInstance = null;
      }
    });
  }

  // ========================================
  // Création budget
  // ========================================

  // ========================================
  // Wizard de création budget
  // ========================================

  openBudgetWizard(): void {
    this.wizardLines = [];
    this.wizardCurrentLine = this.getEmptyWizardLine();
    this.wizardEditingIndex = null;
    this.showBudgetWizard = true;
  }

  async closeBudgetWizard(): Promise<void> {
    if (this.wizardLines.length > 0) {
      const confirmed = await this.dialogService.confirm('Vous avez des lignes non sauvegardées. Voulez-vous vraiment quitter ?');
      if (!confirmed) {
        return;
      }
    }
    this.showBudgetWizard = false;
    this.wizardLines = [];
    this.wizardCurrentLine = this.getEmptyWizardLine();
    this.wizardEditingIndex = null;
  }

  addWizardLine(): void {
    if (!this.wizardCurrentLine.categoryId || !this.wizardCurrentLine.label || !this.wizardCurrentLine.plannedAmount) {
      return;
    }

    if (this.wizardEditingIndex !== null) {
      // Modification d'une ligne existante
      this.wizardLines[this.wizardEditingIndex] = {
        categoryId: this.wizardCurrentLine.categoryId,
        line: { ...this.wizardCurrentLine },
        tempId: this.wizardLines[this.wizardEditingIndex].tempId
      };
      this.wizardEditingIndex = null;
    } else {
      // Ajout d'une nouvelle ligne
      this.wizardLines.push({
        categoryId: this.wizardCurrentLine.categoryId,
        line: { ...this.wizardCurrentLine },
        tempId: Date.now().toString() + Math.random()
      });
    }

    // Garder la catégorie sélectionnée, vider le reste
    const catId = this.wizardCurrentLine.categoryId;
    this.wizardCurrentLine = this.getEmptyWizardLine();
    this.wizardCurrentLine.categoryId = catId;
  }

  editWizardLine(index: number): void {
    const item = this.wizardLines[index];
    this.wizardCurrentLine = {
      ...item.line,
      categoryId: item.categoryId
    };
    this.wizardEditingIndex = index;
  }

  deleteWizardLine(index: number): void {
    this.wizardLines.splice(index, 1);
    if (this.wizardEditingIndex === index) {
      this.wizardEditingIndex = null;
      this.wizardCurrentLine = this.getEmptyWizardLine();
    }
  }

  getWizardLinesByCategory(): Array<{ category: Category; lines: Array<any> }> {
    const grouped: { [key: number]: Array<any> } = {};
    
    this.wizardLines.forEach((item, index) => {
      if (!grouped[item.categoryId]) {
        grouped[item.categoryId] = [];
      }
      grouped[item.categoryId].push({ ...item, index });
    });

    return Object.keys(grouped).map(catId => {
      const category = this.categories.find(c => c.id === Number(catId))!;
      return {
        category,
        lines: grouped[Number(catId)]
      };
    });
  }

  getWizardIncomeCategories(): Array<{ category: Category; lines: Array<any> }> {
    return this.getWizardLinesByCategory().filter(g => g.category.type === CategoryType.INCOME);
  }

  getWizardExpenseCategories(): Array<{ category: Category; lines: Array<any> }> {
    return this.getWizardLinesByCategory().filter(g => g.category.type === CategoryType.EXPENSE);
  }

  getCategoryTotalInWizard(lines: Array<any>): number {
    return lines.reduce((sum, l) => sum + (l.line.plannedAmount || 0), 0);
  }

  getWizardTotal(): number {
    return this.wizardLines.reduce((sum, item) => sum + (item.line.plannedAmount || 0), 0);
  }

  getWizardTotalIncome(): number {
    return this.wizardLines
      .filter(item => {
        const cat = this.categories.find(c => c.id === Number(item.categoryId));
        return cat?.type === CategoryType.INCOME;
      })
      .reduce((sum, item) => sum + (item.line.plannedAmount || 0), 0);
  }

  getWizardTotalExpenses(): number {
    return this.wizardLines
      .filter(item => {
        const cat = this.categories.find(c => c.id === Number(item.categoryId));
        return cat?.type === CategoryType.EXPENSE;
      })
      .reduce((sum, item) => sum + (item.line.plannedAmount || 0), 0);
  }

  getWizardBalance(): number {
    return this.getWizardTotalIncome() - this.getWizardTotalExpenses();
  }

  getBudgetIncomeCategories(): BudgetCategoryInstance[] {
    return this.budgetInstance?.linesByCategory.filter(c => c.categoryType === CategoryType.INCOME) || [];
  }

  getBudgetExpenseCategories(): BudgetCategoryInstance[] {
    return this.budgetInstance?.linesByCategory.filter(c => c.categoryType === CategoryType.EXPENSE) || [];
  }

  // Filtrer les catégories disponibles selon le type
  getFilteredCategories(): Category[] {
    if (!this.availableCategoryType) return this.categories;
    return this.categories.filter(c => c.type === this.availableCategoryType);
  }

  async createBudgetWithLines(): Promise<void> {
    if (!this.selectedFamilyId) {
      this.dialogService.error('Aucune famille sélectionnée');
      return;
    }

    if (this.wizardLines.length === 0) {
      this.dialogService.warning('Veuillez ajouter au moins une ligne budgétaire');
      return;
    }

    this.isCreatingBudget = true;

    try {
      // Mapper les lignes avec leur categoryId
      const budgetName = `Budget ${this.monthName} ${this.currentYear}`;
      const lines = this.wizardLines.map((item, index) => ({
        categoryId: item.categoryId,
        label: item.line.label,
        description: item.line.description,
        plannedAmount: item.line.plannedAmount,
        plannedDate: item.line.plannedDate,
        displayOrder: index
      }));

      // Créer le budget avec toutes les lignes en UNE SEULE requête
      const budget = await this.budgetInstanceService.createBudget(
        this.selectedFamilyId,
        {
          name: budgetName,
          month: this.currentMonth,
          year: this.currentYear,
          lines: lines
        }
      ).toPromise();

      if (!budget) {
        throw new Error('Échec de création du budget');
      }

      // Recharger le budget complet
      this.loadBudget();
      this.closeBudgetWizard();
      this.isCreatingBudget = false;
    } catch (err: any) {
      console.error('Erreur création budget', err);
      this.dialogService.error('Erreur lors de la création du budget: ' + (err.error?.message || err.message));
      this.isCreatingBudget = false;
    }
  }

  // ========================================
  // Gestion des lignes budgétaires
  // ========================================

  openAddIncomeForm(): void {
    this.availableCategoryType = CategoryType.INCOME;
    this.editingCategoryId = null;
    this.editingLineId = null;
    this.currentLine = this.getEmptyLine();
    this.showLineForm = true;
  }

  openAddExpenseForm(): void {
    this.availableCategoryType = CategoryType.EXPENSE;
    this.editingCategoryId = null;
    this.editingLineId = null;
    this.currentLine = this.getEmptyLine();
    this.showLineForm = true;
  }

  openEditLineForm(categoryId: number, line: BudgetLine): void {
    this.availableCategoryType = null; // Pas de changement de catégorie en édition
    this.editingCategoryId = categoryId;
    this.editingLineId = line.id;
    this.currentLine = {
      label: line.label,
      description: line.description,
      plannedAmount: line.plannedAmount,
      plannedDate: line.plannedDate,
      displayOrder: line.displayOrder
    };
    this.showLineForm = true;
  }

  saveLine(): void {
    if (!this.selectedFamilyId || !this.budgetInstance || !this.editingCategoryId) {
      console.error('Données manquantes pour sauvegarder la ligne');
      return;
    }

    if (this.editingLineId) {
      // Modification
      this.budgetLineService.updateBudgetLine(
        this.selectedFamilyId,
        this.budgetInstance.id,
        this.editingLineId,
        this.currentLine
      ).subscribe({
        next: () => {
          this.loadBudget();
          this.closeLineForm();
        },
        error: (err: any) => console.error('Erreur mise à jour ligne', err)
      });
    } else {
      // Création - le categoryId est envoyé directement dans le body par le service
      this.budgetLineService.createBudgetLine(
        this.selectedFamilyId,
        this.budgetInstance.id,
        this.editingCategoryId,
        this.currentLine
      ).subscribe({
        next: () => {
          this.loadBudget();
          this.closeLineForm();
        },
        error: (err: any) => console.error('Erreur création ligne', err)
      });
    }
  }

  async deleteLine(categoryId: number, lineId: number): Promise<void> {
    const confirmed = await this.dialogService.confirm('Supprimer cette ligne budgétaire ?');
    if (!confirmed) return;

    if (!this.selectedFamilyId || !this.budgetInstance) return;

    this.budgetLineService.deleteBudgetLine(
      this.selectedFamilyId,
      this.budgetInstance.id,
      lineId
    ).subscribe({
      next: () => this.loadBudget(),
      error: (err: any) => console.error('Erreur suppression ligne', err)
    });
  }

  closeLineForm(): void {
    this.showLineForm = false;
    this.editingCategoryId = null;
    this.editingLineId = null;
    this.availableCategoryType = null;
    this.currentLine = this.getEmptyLine();
  }

  // ========================================
  // Navigation
  // ========================================

  previousMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadBudget();
  }

  nextMonth(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.monthName = this.getMonthName(this.currentMonth);
    this.loadBudget();
  }

  // ========================================
  // Helpers
  // ========================================

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  private getEmptyLine(): BudgetLineRequest {
    return {
      label: '',
      description: '',
      plannedAmount: 0,
      plannedDate: undefined,
      displayOrder: 0
    };
  }

  private getEmptyWizardLine(): BudgetLineRequest & { categoryId: number } {
    return {
      categoryId: 0,
      label: '',
      description: '',
      plannedAmount: 0,
      plannedDate: undefined,
      displayOrder: 0
    };
  }

  getCategoryById(categoryId: number): Category | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  // Cartes résumé - Prévus
  getTotalPlannedIncome(): number {
    return this.budgetInstance?.totalIncomePlanned || 0;
  }

  getTotalPlannedExpenses(): number {
    return this.budgetInstance?.totalExpensePlanned || 0;
  }

  getTotalPlannedBalance(): number {
    return this.budgetInstance?.totalPlanned || 0;
  }

  // Cartes résumé - Réels
  getTotalActualIncome(): number {
    return this.budgetInstance?.totalIncomeActual || 0;
  }

  getTotalActualExpenses(): number {
    return this.budgetInstance?.totalExpenseActual || 0;
  }

  getTotalActualBalance(): number {
    return this.budgetInstance?.totalActual || 0;
  }

  // Pourcentages de réalisation
  getIncomeRealizationPercentage(): number {
    const planned = this.getTotalPlannedIncome();
    if (planned === 0) return 0;
    return (this.getTotalActualIncome() / planned) * 100;
  }

  getExpenseRealizationPercentage(): number {
    const planned = this.getTotalPlannedExpenses();
    if (planned === 0) return 0;
    return (this.getTotalActualExpenses() / planned) * 100;
  }

  getProgressBarClass(category: BudgetCategoryInstance): string {
    const percentage = category.percentageUsed || 0;
    if (percentage > 100) return 'over-budget';
    if (percentage > 80) return 'warning';
    return 'normal';
  }

  getProgressBarWidth(category: BudgetCategoryInstance): string {
    const percentage = category.percentageUsed || 0;
    return Math.min(percentage, 100) + '%';
  }

  getLineProgressClass(line: BudgetLine): string {
    const percentage = line.percentageUsed || 0;
    if (percentage > 100) return 'over-budget';
    if (percentage > 80) return 'warning';
    return 'normal';
  }

  getLineProgressWidth(line: BudgetLine): string {
    const percentage = line.percentageUsed || 0;
    return Math.min(percentage, 100) + '%';
  }
}
