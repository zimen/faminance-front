import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models';

/**
 * FamilySelectorComponent - Sélecteur de famille moderne avec dropdown
 * Permet de changer de famille active
 */
@Component({
  selector: 'app-family-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="family-selector" *ngIf="currentFamily">
      <button class="selector-button" (click)="toggleDropdown()">
        <div class="family-info">
          <span class="family-icon" [style.background]="currentFamily.color">
            {{ getInitial(currentFamily.name) }}
          </span>
          <div class="family-details">
            <span class="family-name">{{ currentFamily.name }}</span>
            <span class="family-members">{{ currentFamily.membersCount }} membres</span>
          </div>
        </div>
        <span class="dropdown-arrow" [class.open]="isOpen">▼</span>
      </button>

      <!-- Dropdown Menu -->
      <div class="dropdown-menu" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <div class="menu-header">
          <span class="header-title">Mes familles</span>
        </div>

        <div class="family-list">
          <button 
            *ngFor="let family of allFamilies"
            class="family-item"
            [class.active]="family.id === currentFamily.id"
            (click)="selectFamily(family)">
            <span class="family-icon-small" [style.background]="family.color">
              {{ getInitial(family.name) }}
            </span>
            <div class="family-item-details">
              <span class="family-item-name">{{ family.name }}</span>
              <span class="family-item-meta">{{ family.membersCount }} membres</span>
            </div>
            <span class="check-icon" *ngIf="family.id === currentFamily.id">✓</span>
          </button>
        </div>

        <div class="menu-divider"></div>

        <button class="menu-action" (click)="createFamily()">
          <span class="action-icon">➕</span>
          <span>Créer une nouvelle famille</span>
        </button>

        <button class="menu-action" (click)="manageFamily()">
          <span class="action-icon">⚙️</span>
          <span>Gérer mes familles</span>
        </button>
      </div>

      <!-- Backdrop -->
      <div class="backdrop" *ngIf="isOpen" (click)="closeDropdown()"></div>
    </div>
  `,
  styles: [`
    .family-selector {
      position: relative;
    }

    .selector-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
    }

    .selector-button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .family-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .family-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .family-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.125rem;
    }

    .family-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: white;
      text-align: left;
    }

    .family-members {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .dropdown-arrow {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      transition: transform 0.2s ease;
    }

    .dropdown-arrow.open {
      transform: rotate(180deg);
    }

    /* Dropdown Menu */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      min-width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .menu-header {
      padding: 1rem 1rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-title {
      font-weight: 600;
      color: #334155;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .family-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .family-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: white;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;
    }

    .family-item:hover {
      background: #f8fafc;
    }

    .family-item.active {
      background: #eff6ff;
    }

    .family-icon-small {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      color: white;
      flex-shrink: 0;
    }

    .family-item-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1;
    }

    .family-item-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
    }

    .family-item-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .check-icon {
      color: #6366f1;
      font-weight: 700;
      font-size: 1.125rem;
    }

    .menu-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.5rem 0;
    }

    .menu-action {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1rem;
      background: white;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;
      color: #475569;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .menu-action:hover {
      background: #f8fafc;
      color: #1e293b;
    }

    .action-icon {
      font-size: 1.125rem;
    }

    /* Backdrop */
    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }

    /* Scrollbar */
    .family-list::-webkit-scrollbar {
      width: 6px;
    }

    .family-list::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .family-list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .family-list::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .selector-button {
        min-width: 0;
        padding: 0.5rem;
      }

      .family-details {
        display: none;
      }

      .dropdown-menu {
        left: auto;
        right: 0;
      }
    }
  `]
})
export class FamilySelectorComponent implements OnInit {
  currentFamily: Family | null = null;
  allFamilies: Family[] = [];
  isOpen = false;

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current family
    this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamily = family;
    });

    // Load all families
    this.loadFamilies();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdown when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.family-selector')) {
      this.isOpen = false;
    }
  }

  loadFamilies(): void {
    this.familyService.getMyFamilies().subscribe({
      next: (families) => {
        this.allFamilies = families;
      },
      error: (err) => console.error('Erreur chargement familles', err)
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectFamily(family: Family): void {
    if (family.id !== this.currentFamily?.id) {
      this.familyService.selectFamily(family);
      
      // Reload to update all data
      window.location.reload();
    }
    this.closeDropdown();
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  createFamily(): void {
    this.closeDropdown();
    this.router.navigate(['/families/create']);
  }

  manageFamily(): void {
    this.closeDropdown();
    this.router.navigate(['/families']);
  }
}
