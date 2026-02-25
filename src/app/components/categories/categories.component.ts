import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category, CategoryRequest, CategoryType } from '../../core/models/category.model';
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
  showForm = false;
  editMode = false;
  
  currentCategory: Partial<Category> = this.getEmptyCategory();
  
  filterType: CategoryType | 'ALL' = 'ALL';
  CategoryType = CategoryType;

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
    this.loadCategories();
  }

  loadCategories(): void {
    const family = this.familyService.getSelectedFamily();
    if (!family) {
      console.error('Aucune famille sélectionnée');
      return;
    }

    this.categoryService.getCategories(family.id).subscribe({
      next: (categories) => {
        this.categories = categories.sort((a, b) => {
          // Tri par displayOrder, puis par nom si égalité
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return a.name.localeCompare(b.name);
        });
        this.applyFilter();
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
    const family = this.familyService.getSelectedFamily();
    if (!family) {
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
      this.categoryService.updateCategory(family.id, this.currentCategory.id, request)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.closeForm();
          },
          error: (err) => console.error('Erreur lors de la mise à jour', err)
        });
    } else {
      this.categoryService.createCategory(family.id, request)
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
      const family = this.familyService.getSelectedFamily();
      if (!family) {
        console.error('Aucune famille sélectionnée');
        return;
      }

      this.categoryService.deleteCategory(family.id, id).subscribe({
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
