import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetLine, BudgetLineRequest, BUDGET_LINE_LIMITS } from '../../core/models/budget-line.model';
import { BudgetLineService } from '../../core/services/budget-line.service';
import { FamilyService } from '../../core/services/family.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-budget-line-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-line-manager.component.html',
  styleUrls: ['./budget-line-manager.component.css']
})
export class BudgetLineManagerComponent implements OnInit {
  @Input() budgetId!: number;
  @Input() categoryId!: number;
  @Input() categoryName!: string;
  @Input() categoryIcon!: string;
  @Output() linesChanged = new EventEmitter<void>();

  lines: BudgetLine[] = [];
  showForm = false;
  editMode = false;
  currentLine: Partial<BudgetLine> = {};
  
  // Limites
  readonly MAX_LINES = BUDGET_LINE_LIMITS.MAX_LINES_PER_CATEGORY;
  readonly WARNING_THRESHOLD = BUDGET_LINE_LIMITS.WARNING_THRESHOLD;

  // ID de la famille
  private familyId: number | null = null;

  constructor(
    private budgetLineService: BudgetLineService,
    private familyService: FamilyService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.familyId = family.id;
        this.loadLines();
      }
    });
  }

  loadLines(): void {
    if (!this.familyId || !this.budgetId || !this.categoryId) return;

    this.budgetLineService
      .getBudgetLinesByCategory(this.familyId, this.budgetId, this.categoryId)
      .subscribe({
        next: (lines) => {
          this.lines = lines.sort((a, b) => a.displayOrder - b.displayOrder);
        },
        error: (err) => console.error('Erreur lors du chargement des lignes', err)
      });
  }

  openAddForm(): void {
    if (!this.canAddLine()) {
      this.dialogService.warning(`Vous ne pouvez pas ajouter plus de ${this.MAX_LINES} lignes par catégorie`);
      return;
    }

    this.currentLine = {
      label: '',
      description: '',
      plannedAmount: 0,
      plannedDate: undefined,
      displayOrder: this.lines.length
    };
    this.editMode = false;
    this.showForm = true;
  }

  editLine(line: BudgetLine): void {
    this.currentLine = { ...line };
    this.editMode = true;
    this.showForm = true;
  }

  saveLine(): void {
    if (!this.familyId || !this.budgetId || !this.categoryId) return;

    if (!this.currentLine.label || !this.currentLine.plannedAmount) {
      this.dialogService.warning('Le nom et le montant prévu sont requis');
      return;
    }

    const request: BudgetLineRequest = {
      label: this.currentLine.label,
      description: this.currentLine.description,
      plannedAmount: this.currentLine.plannedAmount,
      plannedDate: this.currentLine.plannedDate,
      displayOrder: this.currentLine.displayOrder
    };

    if (this.editMode && this.currentLine.id) {
      this.budgetLineService
        .updateBudgetLine(this.familyId, this.budgetId, this.currentLine.id, request)
        .subscribe({
          next: () => {
            this.loadLines();
            this.closeForm();
            this.linesChanged.emit();
          },
          error: (err) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.budgetLineService
        .createBudgetLine(this.familyId, this.budgetId, this.categoryId, request)
        .subscribe({
          next: () => {
            this.loadLines();
            this.closeForm();
            this.linesChanged.emit();
          },
          error: (err) => console.error('Erreur lors de la création', err)
        });
    }
  }

  async deleteLine(line: BudgetLine): Promise<void> {
    if (!this.familyId || !this.budgetId) return;

    const message = line.transactionCount > 0
      ? `Cette ligne a ${line.transactionCount} transaction(s) rattachée(s). Les transactions seront détachées. Continuer ?`
      : 'Êtes-vous sûr de vouloir supprimer cette ligne ?';

    const confirmed = await this.dialogService.confirm({
      title: 'Supprimer la ligne',
      message,
      type: 'warning'
    });
    if (!confirmed) return;

    this.budgetLineService
      .deleteBudgetLine(this.familyId, this.budgetId, line.id)
      .subscribe({
        next: () => {
          this.loadLines();
          this.linesChanged.emit();
        },
        error: (err) => console.error('Erreur lors de la suppression', err)
      });
  }

  closeForm(): void {
    this.showForm = false;
    this.currentLine = {};
  }

  canAddLine(): boolean {
    return this.budgetLineService.canAddLine(this.lines.length);
  }

  isApproachingLimit(): boolean {
    return this.budgetLineService.isApproachingLimit(this.lines.length);
  }

  getStatusIcon(line: BudgetLine): string {
    return this.budgetLineService.getStatusIcon(line.status);
  }

  getStatusColor(line: BudgetLine): string {
    return this.budgetLineService.getStatusColor(line.status);
  }

  getProgressWidth(line: BudgetLine): number {
    return Math.min((line.actualAmount / line.plannedAmount) * 100, 100);
  }

  getTotalPlanned(): number {
    return this.lines.reduce((sum, line) => sum + line.plannedAmount, 0);
  }

  getTotalActual(): number {
    return this.lines.reduce((sum, line) => sum + line.actualAmount, 0);
  }
}
