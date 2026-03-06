import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetTemplateService } from '../../core/services/budget-template.service';
import { CategoryService } from '../../core/services/category.service';
import { FamilyService } from '../../core/services/family.service';
import {
  BudgetTemplate,
  BudgetTemplateRequest,
  BudgetTemplateItemRequest
} from '../../core/models/budget-template.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-budget-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-template.component.html',
  styleUrls: ['./budget-template.component.css']
})
export class BudgetTemplateComponent implements OnInit {
  templates: BudgetTemplate[] = [];
  categories: Category[] = [];
  showForm = false;
  editMode = false;
  selectedTemplate?: BudgetTemplate;

  // Formulaire
  templateName = '';
  templateDescription = '';
  templateIsDefault = false;
  templateItems: BudgetTemplateItemRequest[] = [];

  // Nouvel item
  showItemForm = false;
  newItemCategoryId = 0;
  newItemPlannedAmount = 0;
  newItemNotes = '';

  // Mois pour application
  showApplyModal = false;
  applyTemplateId = 0;
  applyMonth: number;
  applyYear: number;

  // Messages
  successMessage = '';
  errorMessage = '';

  // ID de la famille sélectionnée
  private selectedFamilyId: number | null = null;

  constructor(
    private budgetTemplateService: BudgetTemplateService,
    private categoryService: CategoryService,
    private familyService: FamilyService
  ) {
    const now = new Date();
    this.applyMonth = now.getMonth() + 1;
    this.applyYear = now.getFullYear();
  }

  ngOnInit(): void {
    // S'abonner à la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.selectedFamilyId = family.id;
        // Charger les données quand la famille est disponible
        this.loadTemplates();
        this.loadCategories();
      } else {
        this.selectedFamilyId = null;
        // Réinitialiser les données si aucune famille n'est sélectionnée
        this.templates = [];
        this.categories = [];
      }
    });
  }

  loadTemplates(): void {
    if (!this.selectedFamilyId) {
      this.errorMessage = 'Aucune famille sélectionnée';
      return;
    }

    this.budgetTemplateService.getTemplates(this.selectedFamilyId).subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des templates', err);
        this.errorMessage = 'Erreur lors du chargement des modèles';
      }
    });
  }

  loadCategories(): void {
    if (!this.selectedFamilyId) return;

    this.categoryService.getCategories(this.selectedFamilyId).subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.active);
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  openCreateForm(): void {
    this.editMode = false;
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(template: BudgetTemplate): void {
    this.editMode = true;
    this.selectedTemplate = template;
    this.templateName = template.name;
    this.templateDescription = template.description || '';
    this.templateIsDefault = template.isDefault;
    this.templateItems = template.items.map(item => ({
      categoryId: item.categoryId,
      plannedAmount: item.plannedAmount,
      notes: item.notes,
      displayOrder: item.displayOrder
    }));
    this.showForm = true;
  }

  saveTemplate(): void {
    if (!this.selectedFamilyId) return;

    if (!this.templateName.trim()) {
      this.errorMessage = 'Le nom du modèle est requis';
      return;
    }

    if (this.templateItems.length === 0) {
      this.errorMessage = 'Ajoutez au moins une catégorie au modèle';
      return;
    }

    const request: BudgetTemplateRequest = {
      name: this.templateName,
      description: this.templateDescription || undefined,
      isDefault: this.templateIsDefault,
      items: this.templateItems.map((item, index) => ({
        ...item,
        displayOrder: index
      }))
    };

    if (this.editMode && this.selectedTemplate) {
      this.budgetTemplateService.updateTemplate(this.selectedFamilyId, this.selectedTemplate.id, request)
        .subscribe({
          next: () => {
            this.successMessage = 'Modèle mis à jour avec succès';
            this.closeForm();
            this.loadTemplates();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour', err);
            this.errorMessage = 'Erreur lors de la mise à jour du modèle';
          }
        });
    } else {
      this.budgetTemplateService.createTemplate(this.selectedFamilyId, request)
        .subscribe({
          next: () => {
            this.successMessage = 'Modèle créé avec succès';
            this.closeForm();
            this.loadTemplates();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            console.error('Erreur lors de la création', err);
            this.errorMessage = 'Erreur lors de la création du modèle';
          }
        });
    }
  }

  deleteTemplate(templateId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    if (!this.selectedFamilyId) return;

    this.budgetTemplateService.deleteTemplate(this.selectedFamilyId, templateId).subscribe({
      next: () => {
        this.successMessage = 'Modèle supprimé avec succès';
        this.loadTemplates();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
        this.errorMessage = 'Erreur lors de la suppression du modèle';
      }
    });
  }

  openApplyModal(templateId: number): void {
    this.applyTemplateId = templateId;
    this.showApplyModal = true;
  }

  applyTemplate(): void {
    if (!this.selectedFamilyId) return;

    this.budgetTemplateService.applyTemplate(
      this.selectedFamilyId,
      this.applyTemplateId,
      this.applyMonth,
      this.applyYear
    ).subscribe({
      next: (budgets) => {
        this.successMessage = `Modèle appliqué ! ${budgets.length} budget(s) créé(s)`;
        this.closeApplyModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Erreur lors de l\'application du modèle', err);
        this.errorMessage = 'Erreur lors de l\'application du modèle';
      }
    });
  }

  openItemForm(): void {
    this.newItemCategoryId = 0;
    this.newItemPlannedAmount = 0;
    this.newItemNotes = '';
    this.showItemForm = true;
  }

  addItem(): void {
    if (this.newItemCategoryId === 0) {
      this.errorMessage = 'Sélectionnez une catégorie';
      return;
    }

    if (this.newItemPlannedAmount <= 0) {
      this.errorMessage = 'Le montant doit être supérieur à 0';
      return;
    }

    // Vérifier que la catégorie n'est pas déjà ajoutée
    if (this.templateItems.some(item => item.categoryId === this.newItemCategoryId)) {
      this.errorMessage = 'Cette catégorie est déjà dans le modèle';
      return;
    }

    this.templateItems.push({
      categoryId: this.newItemCategoryId,
      plannedAmount: this.newItemPlannedAmount,
      notes: this.newItemNotes || undefined,
      displayOrder: this.templateItems.length
    });

    this.closeItemForm();
    this.errorMessage = '';
  }

  removeItem(index: number): void {
    this.templateItems.splice(index, 1);
  }

  moveItemUp(index: number): void {
    if (index === 0) return;
    const temp = this.templateItems[index];
    this.templateItems[index] = this.templateItems[index - 1];
    this.templateItems[index - 1] = temp;
  }

  moveItemDown(index: number): void {
    if (index === this.templateItems.length - 1) return;
    const temp = this.templateItems[index];
    this.templateItems[index] = this.templateItems[index + 1];
    this.templateItems[index + 1] = temp;
  }

  getCategoryById(categoryId: number): Category | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  getAvailableCategories(): Category[] {
    return this.categories.filter(
      cat => !this.templateItems.some(item => item.categoryId === cat.id)
    );
  }

  getTotalPlanned(): number {
    return this.templateItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  }

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  closeItemForm(): void {
    this.showItemForm = false;
    this.newItemCategoryId = 0;
    this.newItemPlannedAmount = 0;
    this.newItemNotes = '';
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  resetForm(): void {
    this.templateName = '';
    this.templateDescription = '';
    this.templateIsDefault = false;
    this.templateItems = [];
    this.selectedTemplate = undefined;
    this.errorMessage = '';
  }
}
