import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { FamilyService } from '../../../core/services/family.service';
import { DialogService } from '../../../shared/services/dialog.service';

interface CategorySelection {
  id: number;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  selected: boolean;
}

@Component({
  selector: 'app-step3-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step3-categories.component.html',
  styleUrls: ['./step3-categories.component.css']
})
export class Step3CategoriesComponent implements OnInit {
  categories: CategorySelection[] = [];
  loading = false;
  errorMessage = '';
  familyId: number | null = null;

  constructor(
    private onboardingService: OnboardingService,
    private familyService: FamilyService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.familyId = this.familyService.getSelectedFamily()?.id || null;

    if (!this.familyId) {
      this.errorMessage = 'Erreur: Aucune famille sélectionnée';
      return;
    }

    // Charger les catégories recommandées
    this.loadRecommendedCategories();
  }

  loadRecommendedCategories(): void {
    this.loading = true;

    this.onboardingService.getRecommendedCategoryIds().subscribe({
      next: (categoryIds) => {
        // Pour l'instant, utilisons des données de développement
        // TODO: Récupérer les vraies catégories depuis le backend
        this.categories = this.getMockCategories(categoryIds);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
        // Fallback sur des données mock
        this.categories = this.getMockCategories([1, 2, 3, 4, 5, 6, 7, 8]);
        this.loading = false;
      }
    });
  }

  getMockCategories(selectedIds: number[]): CategorySelection[] {
    const allCategories: CategorySelection[] = [
      { id: 1, name: 'Salaire', icon: '💰', type: 'INCOME', selected: true },
      { id: 2, name: 'Alimentation', icon: '🍔', type: 'EXPENSE', selected: true },
      { id: 3, name: 'Transport', icon: '🚗', type: 'EXPENSE', selected: true },
      { id: 4, name: 'Logement', icon: '🏠', type: 'EXPENSE', selected: true },
      { id: 5, name: 'Loisirs', icon: '🎮', type: 'EXPENSE', selected: true },
      { id: 6, name: 'Santé', icon: '💊', type: 'EXPENSE', selected: true },
      { id: 7, name: 'Éducation', icon: '📚', type: 'EXPENSE', selected: false },
      { id: 8, name: 'Épargne', icon: '🏦', type: 'EXPENSE', selected: false },
      { id: 9, name: 'Vêtements', icon: '👕', type: 'EXPENSE', selected: false },
      { id: 10, name: 'Énergie', icon: '⚡', type: 'EXPENSE', selected: false }
    ];

    return allCategories.map(cat => ({
      ...cat,
      selected: selectedIds.includes(cat.id)
    }));
  }

  toggleCategory(category: CategorySelection): void {
    category.selected = !category.selected;
  }

  getSelectedCount(): number {
    return this.categories.filter(c => c.selected).length;
  }

  onSubmit(): void {
    if (!this.familyId) {
      this.errorMessage = 'Erreur: Aucune famille sélectionnée';
      return;
    }

    const selectedIds = this.categories
      .filter(c => c.selected)
      .map(c => c.id);

    if (selectedIds.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins une catégorie';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.onboardingService.addSystemCategoriesToFamily(this.familyId, selectedIds).subscribe({
      next: () => {
        // Passer à l'étape 4
        this.onboardingService.nextStep();
        this.router.navigate(['/onboarding/first-transaction']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'ajout des catégories.';
      }
    });
  }

  async onSkip(): Promise<void> {
    const confirmed = await this.dialogService.confirm('Êtes-vous sûr de vouloir sauter cette étape ? Vous pourrez ajouter des catégories plus tard.');
    if (!confirmed) return;

    this.onboardingService.skipStep();
    this.router.navigate(['/onboarding/first-transaction']);
  }

  onBack(): void {
    this.onboardingService.previousStep();
    this.router.navigate(['/onboarding/family-setup']);
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }
}
