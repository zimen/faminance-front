import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BudgetTemplateService } from '../../core/services/budget-template.service';
import { CategoryService } from '../../core/services/category.service';
import { FamilyService } from '../../core/services/family.service';
import {
  BudgetTemplate,
  BudgetTemplateRequest,
  BudgetTemplateLineRequest
} from '../../core/models/budget-template.model';
import { Category } from '../../core/models/category.model';
import { RecurrencePattern } from '../../core/models/budget-forecast.model';
import { BUDGET_LINE_LIMITS } from '../../core/models/budget-line.model';

/**
 * Ligne budgétaire simplifiée avec catégorie
 */
interface TemplateLine extends BudgetTemplateLineRequest {
  categoryId: number;
}

@Component({
  selector: 'app-budget-template-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './budget-template-form.component.html',
  styleUrls: ['./budget-template-form.component.css']
})
export class BudgetTemplateFormComponent implements OnInit {
  // Mode édition
  editMode = false;
  templateId?: number;
  
  // Formulaire
  templateName = '';
  templateDescription = '';
  templateIsDefault = false;
  
  // Lignes budgétaires (structure simplifiée)
  lines: TemplateLine[] = [];
  
  // Formulaire ligne
  showLineForm = false;
  editingLineIndex = -1;
  newLine: TemplateLine = this.createEmptyLine();
  
  // Données
  categories: Category[] = [];
  
  // Récurrence patterns
  recurrencePatterns = [
    { value: RecurrencePattern.NONE, label: 'Aucune' },
    { value: RecurrencePattern.DAILY, label: 'Quotidienne' },
    { value: RecurrencePattern.WEEKLY, label: 'Hebdomadaire' },
    { value: RecurrencePattern.MONTHLY, label: 'Mensuelle' },
    { value: RecurrencePattern.QUARTERLY, label: 'Trimestrielle' },
    { value: RecurrencePattern.YEARLY, label: 'Annuelle' }
  ];
  
  // Limites
  readonly MAX_LINES_PER_CATEGORY = BUDGET_LINE_LIMITS.MAX_LINES_PER_CATEGORY;
  
  // Messages
  successMessage = '';
  errorMessage = '';
  loading = false;
  
  // ID famille
  private selectedFamilyId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetTemplateService: BudgetTemplateService,
    private categoryService: CategoryService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    // Récupérer la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.selectedFamilyId = family.id;
        this.loadCategories();
        
        // Vérifier si mode édition
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.editMode = true;
          this.templateId = parseInt(id, 10);
          this.loadTemplate(this.templateId);
        }
      }
    });
  }

  loadCategories(): void {
    if (!this.selectedFamilyId) return;

    this.categoryService.getCategories(this.selectedFamilyId).subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.active);
      },
      error: (err) => {
        console.error('Erreur chargement catégories', err);
        this.errorMessage = 'Erreur lors du chargement des catégories';
      }
    });
  }

  loadTemplate(templateId: number): void {
    if (!this.selectedFamilyId) return;

    this.loading = true;
    this.budgetTemplateService.getTemplateById(this.selectedFamilyId, templateId).subscribe({
      next: (template) => {
        this.templateName = template.name;
        this.templateDescription = template.description || '';
        this.templateIsDefault = template.isDefault;
        
        // Convertir items → lignes avec categoryId
        this.lines = [];
        template.items.forEach(item => {
          if (item.lines && item.lines.length > 0) {
            // Si des lignes détaillées existent
            item.lines.forEach(line => {
              this.lines.push({
                ...line,
                categoryId: item.categoryId
              });
            });
          } else if (item.plannedAmount) {
            // Sinon créer une ligne simple depuis le montant global (legacy)
            this.lines.push({
              categoryId: item.categoryId,
              label: this.getCategoryName(item.categoryId),
              plannedAmount: item.plannedAmount,
              description: item.notes,
              recurrence: RecurrencePattern.NONE,
              autoCreateTransaction: false,
              displayOrder: this.lines.length
            });
          }
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement template', err);
        this.errorMessage = 'Template introuvable';
        this.loading = false;
      }
    });
  }

  saveTemplate(): void {
    if (!this.selectedFamilyId) return;

    if (!this.templateName.trim()) {
      this.errorMessage = 'Le nom du modèle est requis';
      return;
    }

    if (this.lines.length === 0) {
      this.errorMessage = 'Ajoutez au moins une ligne budgétaire';
      return;
    }

    // Construire la requête simplifiée : envoi direct des lignes avec categoryId
    const request: BudgetTemplateRequest = {
      name: this.templateName,
      description: this.templateDescription || undefined,
      isDefault: this.templateIsDefault,
      lines: this.lines.map((line, index) => ({
        ...line,
        categoryId: Number(line.categoryId), // S'assurer que c'est un nombre
        displayOrder: index
      }))
    };

    console.log('Sauvegarde template avec requête simplifiée:', request);

    this.loading = true;
    
    if (this.editMode && this.templateId) {
      // Mise à jour
      this.budgetTemplateService.updateTemplate(this.selectedFamilyId, this.templateId, request)
        .subscribe({
          next: (response) => {
            console.log('Template mis à jour, réponse:', response);
            this.router.navigate(['/budget-templates']);
          },
          error: (err) => {
            console.error('Erreur mise à jour', err);
            this.errorMessage = 'Erreur lors de la mise à jour';
            this.loading = false;
          }
        });
    } else {
      // Création
      this.budgetTemplateService.createTemplate(this.selectedFamilyId, request)
        .subscribe({
          next: (response) => {
            console.log('Template créé, réponse:', response);
            this.router.navigate(['/budget-templates']);
          },
          error: (err) => {
            console.error('Erreur création', err);
            this.errorMessage = 'Erreur lors de la création';
            this.loading = false;
          }
        });
    }
  }

  // ========================================
  // Gestion des lignes
  // ========================================

  openLineForm(): void {
    this.editingLineIndex = -1;
    this.newLine = this.createEmptyLine();
    this.showLineForm = true;
  }

  openEditLineForm(lineIndex: number): void {
    this.editingLineIndex = lineIndex;
    this.newLine = { ...this.lines[lineIndex] };
    this.showLineForm = true;
  }

  saveLine(): void {
    if (!this.newLine.label.trim()) {
      this.errorMessage = 'Le libellé est requis';
      return;
    }

    if (this.newLine.categoryId === 0) {
      this.errorMessage = 'Sélectionnez une catégorie';
      return;
    }

    if (this.newLine.plannedAmount <= 0) {
      this.errorMessage = 'Le montant doit être supérieur à 0';
      return;
    }

    // Convertir categoryId en nombre (au cas où le select retournerait une string)
    const categoryIdAsNumber = Number(this.newLine.categoryId);

    // Vérifier la limite par catégorie
    const linesInCategory = this.lines.filter(l => l.categoryId === categoryIdAsNumber);
    if (this.editingLineIndex < 0 && linesInCategory.length >= this.MAX_LINES_PER_CATEGORY) {
      this.errorMessage = `Maximum ${this.MAX_LINES_PER_CATEGORY} lignes par catégorie`;
      return;
    }

    if (this.editingLineIndex >= 0) {
      // Modification
      this.lines[this.editingLineIndex] = { ...this.newLine, categoryId: categoryIdAsNumber };
    } else {
      // Création
      this.lines.push({
        ...this.newLine,
        categoryId: categoryIdAsNumber,
        displayOrder: this.lines.length
      });
    }

    console.log('Ligne sauvegardée:', this.newLine);    
    console.log('Lignes actuelles:', this.lines);

    this.closeLineForm();
    this.errorMessage = '';
  }

  removeLine(lineIndex: number): void {
    if (confirm('Supprimer cette ligne budgétaire ?')) {
      this.lines.splice(lineIndex, 1);
      // Réorganiser displayOrder
      this.lines.forEach((line, index) => {
        line.displayOrder = index;
      });
    }
  }

  closeLineForm(): void {
    this.showLineForm = false;
    this.editingLineIndex = -1;
    this.newLine = this.createEmptyLine();
  }

  createEmptyLine(): TemplateLine {
    return {
      categoryId: 0,
      label: '',
      description: '',
      plannedAmount: 0,
      recurrence: RecurrencePattern.NONE,
      autoCreateTransaction: false,
      displayOrder: 0
    };
  }

  // ========================================
  // Helpers
  // ========================================

  getCategoryById(categoryId: number): Category | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  getCategoryName(categoryId: number): string {
    return this.getCategoryById(categoryId)?.name || 'Catégorie inconnue';
  }

  getLinesByCategory(categoryId: number): TemplateLine[] {
    // S'assurer que la comparaison se fait avec des nombres
    return this.lines.filter(l => Number(l.categoryId) === Number(categoryId));
  }

  getCategoriesUsed(): Category[] {    
    // Convertir en nombres pour éviter les problèmes string/number
    const usedCategoryIds = new Set(this.lines.map(l => Number(l.categoryId)));
    console.log("IDs de catégories utilisées:", Array.from(usedCategoryIds));
    console.log("Catégories disponibles:", this.categories);
    const result = this.categories.filter(c => usedCategoryIds.has(c.id));
    console.log("Catégories utilisées (résultat):", result);
    return result;
  }

  getTotalPlanned(): number {
    return this.lines.reduce((sum, line) => sum + line.plannedAmount, 0);
  }

  getTotalForCategory(categoryId: number): number {
    return this.lines
      .filter(l => Number(l.categoryId) === Number(categoryId))
      .reduce((sum, line) => sum + line.plannedAmount, 0);
  }

  canAddLineToCategory(categoryId: number): boolean {
    const count = this.lines.filter(l => Number(l.categoryId) === Number(categoryId)).length;
    return count < this.MAX_LINES_PER_CATEGORY;
  }

  cancel(): void {
    if (confirm('Annuler les modifications ?')) {
      this.router.navigate(['/budget-templates']);
    }
  }
}
