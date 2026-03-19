import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category, CategoryRequest, CategoryType, SystemCategory } from '../../core/models/category.model';
import { FamilyService } from '../../core/services/family.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  systemCategories: SystemCategory[] = [];
  filteredSystemCategories: SystemCategory[] = [];
  
  showForm = false;
  editMode = false;
  
  currentCategory: Partial<Category> = this.getEmptyCategory();
  
  // Onglets
  activeTab: 'my-categories' | 'system-catalog' = 'my-categories';
  
  // Filtres
  filterType: CategoryType | 'ALL' = 'ALL';
  systemFilterType: CategoryType | 'ALL' = 'ALL';
  showRecommendedOnly = false;
  
  CategoryType = CategoryType;

  // ID de la famille sélectionnée
  private selectedFamilyId: number | null = null;

  // Emojis couramment utilisés pour les catégories
  commonIcons = [
    '🍔', '🏠', '🚗', '⚡', '💰', '🎮', '🏥', '✈️', 
    '🎓', '👕', '🎬', '📱', '🏋️', '🎨', '🍕', '☕',
    '💼', '🛒', '🎁', '💳', '📚', '🚌', '🏦', '💊'
  ];

  // Couleurs prédéfinies
  commonColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#c0392b',
    '#2980b9', '#27ae60', '#d35400', '#8e44ad', '#16a085'
  ];

  constructor(
    private categoryService: CategoryService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    // S'abonner à la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.selectedFamilyId = family.id;
        // Charger les données quand la famille est disponible
        this.loadCategories();
        this.loadSystemCategories();
      } else {
        this.selectedFamilyId = null;
        // Réinitialiser les données si aucune famille n'est sélectionnée
        this.categories = [];
        this.filteredCategories = [];
        this.systemCategories = [];
        this.filteredSystemCategories = [];
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
        this.categories = categories.sort((a, b) => {
          // Tri par displayOrder, puis par nom si égalité
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return a.name.localeCompare(b.name);
        });
        this.applyFilter();
        this.applySystemFilter(); // Mettre à jour le filtre système pour exclure les catégories déjà ajoutées
      },
      error: (err) => console.error('Erreur lors du chargement des catégories', err)
    });
  }

  applyFilter(): void {
    if (this.filterType === 'ALL') {
      this.filteredCategories = this.categories;
    } else {
      this.filteredCategories = this.categories.filter(c => c.type === this.filterType);
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  loadSystemCategories(): void {
    const endpoint = this.showRecommendedOnly 
      ? this.categoryService.getRecommendedSystemCategories()
      : this.categoryService.getSystemCategories();

    endpoint.subscribe({
      next: (systemCategories) => {
        this.systemCategories = systemCategories;
        this.applySystemFilter();
      },
      error: (err) => console.error('Erreur lors du chargement des catégories système', err)
    });
  }

  applySystemFilter(): void {
    let filtered = [...this.systemCategories];

    // Filtre par type
    if (this.systemFilterType !== 'ALL') {
      filtered = filtered.filter(c => c.defaultType === this.systemFilterType);
    }

    // Exclure les catégories déjà ajoutées à la famille
    const familySystemCategoryIds = this.categories
      .filter(c => c.systemCategoryId)
      .map(c => c.systemCategoryId);
    
    filtered = filtered.filter(sc => !familySystemCategoryIds.includes(sc.id));

    this.filteredSystemCategories = filtered;
  }

  onSystemFilterChange(): void {
    this.applySystemFilter();
  }

  onRecommendedToggle(): void {
    this.loadSystemCategories();
  }

  switchTab(tab: 'my-categories' | 'system-catalog'): void {
    this.activeTab = tab;
  }

  addSystemCategory(systemCategory: SystemCategory): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    if (confirm(`Ajouter "${systemCategory.name}" à vos catégories ?`)) {
      this.categoryService.addSystemCategoryToFamily(this.selectedFamilyId, systemCategory)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.loadSystemCategories(); // Recharger pour mettre à jour la liste
          },
          error: (err) => console.error('Erreur lors de l\'ajout de la catégorie système', err)
        });
    }
  }

  isSystemCategory(category: Category): boolean {
    return category.isSystemCategory === true;
  }

  openAddForm(): void {
    this.currentCategory = this.getEmptyCategory();
    this.editMode = false;
    this.showForm = true;
  }

  editCategory(category: Category): void {
    this.currentCategory = { ...category };
    this.editMode = true;
    this.showForm = true;
  }

  saveCategory(): void {
    if (!this.selectedFamilyId) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    const request: CategoryRequest = {
      name: this.currentCategory.name!,
      type: this.currentCategory.type!,
      icon: this.currentCategory.icon!,
      color: this.currentCategory.color!,
      description: this.currentCategory.description,
      displayOrder: this.currentCategory.displayOrder || 0
    };

    if (this.editMode && this.currentCategory.id) {
      this.categoryService.updateCategory(this.selectedFamilyId, this.currentCategory.id, request)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.categoryService.createCategory(this.selectedFamilyId, request)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la création', err)
        });
    }
  }

  deleteCategory(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Toutes les transactions associées seront affectées.')) {
      if (!this.selectedFamilyId) {
        console.error('Aucune famille sélectionnée');
        return;
      }

      this.categoryService.deleteCategory(this.selectedFamilyId, id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => console.error('Erreur lors de la suppression', err)
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.currentCategory = this.getEmptyCategory();
  }

  selectIcon(icon: string): void {
    this.currentCategory.icon = icon;
  }

  selectColor(color: string): void {
    this.currentCategory.color = color;
  }

  private getEmptyCategory(): Partial<Category> {
    return {
      name: '',
      description: '',
      type: CategoryType.EXPENSE,
      color: '#3498db',
      icon: '📁',
      displayOrder: 0
    };
  }

  getIncomeCount(): number {
    return this.categories.filter(c => c.type === CategoryType.INCOME).length;
  }

  getExpenseCount(): number {
    return this.categories.filter(c => c.type === CategoryType.EXPENSE).length;
  }
}
