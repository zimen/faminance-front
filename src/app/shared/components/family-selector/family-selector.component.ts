import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models';

/**
 * FamilySelectorComponent - Sélecteur de famille (en haut de l'application)
 * Permet de changer de famille active
 */
@Component({
  selector: 'app-family-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="family-selector">
      <div class="selector-wrapper">
        <select 
          [(ngModel)]="selectedFamilyId" 
          (change)="onFamilyChange()"
          class="family-select"
        >
          <option value="" disabled>Sélectionner une famille</option>
          <option *ngFor="let family of families" [value]="family.id">
            {{ family.name }} ({{ family.myRole }})
          </option>
        </select>
      </div>
      <button class="btn-create" (click)="createFamily()" title="Créer une nouvelle famille">
        + Nouvelle Famille
      </button>
    </div>
  `,
  styles: [`
    .family-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .selector-wrapper {
      flex: 1;
      max-width: 300px;
    }

    .family-select {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .family-select:hover {
      border-color: #cbd5e0;
    }

    .family-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn-create {
      padding: 10px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    @media (max-width: 768px) {
      .family-selector {
        flex-direction: column;
        align-items: stretch;
      }

      .selector-wrapper {
        max-width: none;
      }
    }
  `]
})
export class FamilySelectorComponent implements OnInit {
  families: Family[] = [];
  selectedFamilyId: number | '' = '';

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFamilies();
    
    // Écouter les changements de famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      this.selectedFamilyId = family?.id || '';
    });
  }

  loadFamilies(): void {
    this.familyService.getMyFamilies().subscribe({
      next: families => {
        this.families = families;
        
        // Si aucune famille n'est sélectionnée, sélectionner la première
        if (families.length > 0) {
          const selected = this.familyService.getSelectedFamily();
          if (!selected) {
            this.selectFamily(families[0].id);
          }
        }
      },
      error: error => {
        console.error('Erreur lors du chargement des familles:', error);
      }
    });
  }

  onFamilyChange(): void {
    if (this.selectedFamilyId && typeof this.selectedFamilyId === 'number') {
      this.selectFamily(this.selectedFamilyId);
    }
  }

  selectFamily(id: number): void {
    const family = this.families.find(f => f.id === id);
    if (family) {
      this.familyService.selectFamily(family);
    }
  }

  createFamily(): void {
    this.router.navigate(['/families/create']);
  }
}
