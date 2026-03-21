import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BudgetTemplateService } from '../../core/services/budget-template.service';
import { BudgetInstanceService } from '../../core/services/budget-instance.service';
import { FamilyService } from '../../core/services/family.service';
import { DialogService } from '../../shared/services/dialog.service';
import { BudgetTemplate } from '../../core/models/budget-template.model';

@Component({
  selector: 'app-budget-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-template.component.html',
  styleUrls: ['./budget-template.component.css']
})
export class BudgetTemplateComponent implements OnInit {
  templates: BudgetTemplate[] = [];

  // Modal application
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
    private budgetInstanceService: BudgetInstanceService,
    private familyService: FamilyService,
    private router: Router,
    private dialogService: DialogService
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
        this.loadTemplates();
      } else {
        this.selectedFamilyId = null;
        this.templates = [];
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
        console.log('Templates chargés:', templates);
        // Vérifier la structure des lignes
        if (templates.length > 0) {
          console.log('Premier template items:', templates[0].items);
          if (templates[0].items.length > 0) {
            console.log('Premier item lines:', templates[0].items[0].lines);
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des templates', err);
        this.errorMessage = 'Erreur lors du chargement des modèles';
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/budget-templates/create']);
  }

  navigateToEdit(templateId: number): void {
    this.router.navigate(['/budget-templates', templateId, 'edit']);
  }

  async deleteTemplate(templateId: number): Promise<void> {
    const confirmed = await this.dialogService.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?');
    if (!confirmed) return;

    if (!this.selectedFamilyId) return;

    this.budgetTemplateService.deleteTemplate(this.selectedFamilyId, templateId).subscribe({
      next: () => {
        this.dialogService.success('Modèle supprimé avec succès');
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
        this.dialogService.error('Erreur lors de la suppression du modèle');
      }
    });
  }

  openApplyModal(templateId: number): void {
    this.applyTemplateId = templateId;
    this.showApplyModal = true;
  }

  applyTemplate(): void {
    if (!this.selectedFamilyId) return;

    this.budgetInstanceService.generateFromTemplate(
      this.selectedFamilyId,
      this.applyTemplateId,
      this.applyMonth,
      this.applyYear
    ).subscribe({
      next: (budgetInstance) => {
        const categories = budgetInstance.linesByCategory || [];
        const linesCount = categories.reduce(
          (sum, cat) => sum + cat.lines.length, 
          0
        );
        this.successMessage = `Modèle appliqué ! Budget créé avec ${categories.length} catégorie(s) et ${linesCount} ligne(s) budgétaire(s)`;
        this.closeApplyModal();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        console.error('Erreur lors de l\'application du modèle', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'application du modèle';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  }
}
