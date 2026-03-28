import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { FamilyService } from '../../../core/services/family.service';
import { OnboardingProgress } from '../../../core/models';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  route?: string;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrls: ['./onboarding-checklist.component.css']
})
export class OnboardingChecklistComponent implements OnInit {
  progress: OnboardingProgress | null = null;
  checklist: ChecklistItem[] = [];
  isExpanded = true;

  constructor(
    private onboardingService: OnboardingService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.onboardingService.getProgress().subscribe({
      next: (progress) => {
        this.progress = progress;
        this.buildChecklist();
      }
    });
  }

  buildChecklist(): void {
    if (!this.progress) return;

    this.checklist = [
      {
        id: 'account',
        title: 'Créer votre compte',
        description: 'Inscription complétée',
        icon: '✅',
        completed: this.progress.accountCreated,
        route: undefined
      },
      {
        id: 'family',
        title: 'Créer votre famille',
        description: 'Famille configurée',
        icon: this.progress.familyCreated ? '✅' : '👨‍👩‍👧‍👦',
        completed: this.progress.familyCreated,
        route: '/families/create'
      },
      {
        id: 'categories',
        title: 'Ajouter des catégories',
        description: 'Au moins une catégorie ajoutée',
        icon: this.progress.categoriesConfigured > 0 ? '✅' : '📊',
        completed: this.progress.categoriesConfigured > 0,
        route: '/categories'
      },
      {
        id: 'transaction',
        title: 'Première transaction',
        description: 'Commencer à suivre vos finances',
        icon: this.progress.firstTransactionAdded ? '✅' : '💰',
        completed: this.progress.firstTransactionAdded,
        route: '/transactions'
      },
      {
        id: 'budget',
        title: 'Créer un budget',
        description: 'Définir vos objectifs',
        icon: this.progress.budgetsSet ? '✅' : '🎯',
        completed: this.progress.budgetsSet,
        route: '/budgets'
      }
    ];
  }

  getCompletionPercentage(): number {
    if (this.checklist.length === 0) return 0;
    const completedCount = this.checklist.filter(item => item.completed).length;
    return Math.round((completedCount / this.checklist.length) * 100);
  }

  getCompletedCount(): number {
    return this.checklist.filter(item => item.completed).length;
  }

  getTotalCount(): number {
    return this.checklist.length;
  }

  isAllCompleted(): boolean {
    return this.getCompletionPercentage() === 100;
  }

  navigateTo(item: ChecklistItem): void {
    if (item.completed || !item.route) return;
    this.router.navigate([item.route]);
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  dismiss(): void {
    // On pourrait sauvegarder une préférence pour cacher définitivement ce widget
    // Pour l'instant, on le cache juste visuellement
    const widget = document.querySelector('.onboarding-checklist-widget');
    if (widget) {
      widget.remove();
    }
  }

  getMotivationMessage(): string {
    const percentage = this.getCompletionPercentage();
    
    if (percentage >= 80) {
      return 'Vous y êtes presque ! Encore quelques étapes et vous aurez tout configuré ! 🎉';
    } else if (percentage >= 50) {
      return 'Excellent travail ! Continuez sur cette lancée ! 💪';
    } else if (percentage >= 20) {
      return 'Bon début ! Poursuivez pour profiter pleinement de l\'application. 🚀';
    } else {
      return 'Commencez par compléter ces étapes pour tirer le meilleur parti de Faminance. ✨';
    }
  }
}
