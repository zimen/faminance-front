import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { FamilyService } from '../../../core/services/family.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryType } from '../../../core/models';

@Component({
  selector: 'app-step4-first-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step4-first-transaction.component.html',
  styleUrls: ['./step4-first-transaction.component.css']
})
export class Step4FirstTransactionComponent implements OnInit {
  transactionForm!: FormGroup;
  categories: Category[] = [];
  loading = false;
  errorMessage = '';
  familyId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private familyService: FamilyService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.familyId = this.familyService.getSelectedFamily()?.id || null;

    if (!this.familyId) {
      this.errorMessage = 'Erreur: Aucune famille sélectionnée';
      return;
    }

    this.transactionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, [Validators.required]],
      date: [this.getTodayDate(), [Validators.required]]
    });

    this.loadCategories();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadCategories(): void {
    if (!this.familyId) return;

    this.categoryService.getCategories(this.familyId).subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.active);
        
        // Sélectionner la première catégorie de dépense par défaut
        const firstExpenseCategory = this.categories.find(c => c.type === 'EXPENSE');
        if (firstExpenseCategory) {
          this.transactionForm.patchValue({ categoryId: firstExpenseCategory.id });
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.transactionForm.invalid || !this.familyId) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.transactionForm.value;
    const transaction = {
      description: formValue.title,
      amount: Number(formValue.amount),
      categoryId: Number(formValue.categoryId),
      date: formValue.date,
      type: this.getTransactionType(formValue.categoryId),
      notes: ''
    };

    this.onboardingService.addFirstTransaction(this.familyId, transaction).subscribe({
      next: () => {
        // Marquer l'onboarding comme complété
        this.onboardingService.markOnboardingComplete();
        this.router.navigate(['/onboarding/complete']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'ajout de la transaction.';
      }
    });
  }

  getTransactionType(categoryId: number): CategoryType {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.type || CategoryType.EXPENSE;
  }

  onSkip(): void {
    // Marquer directement l'onboarding comme complété
    this.onboardingService.markOnboardingComplete();
    this.router.navigate(['/dashboard']);
  }

  onBack(): void {
    this.onboardingService.previousStep();
    this.router.navigate(['/onboarding/categories']);
  }

  getProgress(): number {
    return this.onboardingService.getCompletionPercentage();
  }

  getCategoryIcon(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || '📝';
  }
}
