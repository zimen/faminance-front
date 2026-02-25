import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';

/**
 * FamilyListComponent - Liste des familles de l'utilisateur
 */
@Component({
  selector: 'app-family-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RoleBadgeComponent],
  templateUrl: './family-list.component.html',
  styleUrls: ['./family-list.component.css']
})
export class FamilyListComponent implements OnInit {
  families: Family[] = [];
  selectedFamilyId?: number;
  loading = true;
  errorMessage = '';

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFamilies();
    
    // Suivre la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      this.selectedFamilyId = family?.id;
    });
  }

  loadFamilies(): void {
    this.loading = true;
    this.errorMessage = '';

    this.familyService.getMyFamilies().subscribe({
      next: families => {
        this.families = families;
        this.loading = false;

        // Si l'utilisateur a des familles mais aucune n'est sélectionnée, rediriger vers le dashboard
        if (families.length > 0) {
          const selected = this.familyService.getSelectedFamily();
          if (!selected) {
            this.familyService.selectFamily(families[0]);
          }
        }
      },
      error: error => {
        this.loading = false;
        this.errorMessage = error.message || 'Erreur lors du chargement des familles';
      }
    });
  }

  selectFamily(family: Family): void {
    this.familyService.selectFamily(family);
    // Rediriger vers le dashboard
    this.router.navigate(['/dashboard']);
  }
}
