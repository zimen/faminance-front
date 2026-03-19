import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { Family } from '../../../core/models/family.model';

@Component({
  selector: 'app-family-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <h2 class="section-title">Paramètres de la famille</h2>

      <!-- Edit Family Form -->
      <div class="settings-section" *ngIf="family">
        <h3 class="subsection-title">Informations générales</h3>
        <div class="form-card">
          <div class="form-group">
            <label class="form-label">Nom de la famille</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="family.name"
              placeholder="Ex: Famille Dupont"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description (optionnel)</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="family.description"
              placeholder="Une courte description de votre famille..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Devise</label>
            <select class="form-select" [(ngModel)]="family.currency">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF (Fr)</option>
            </select>
          </div>

          <div class="form-actions">
            <button class="btn-save" (click)="saveFamily()" [disabled]="isSaving">
              <span class="btn-icon" *ngIf="!isSaving">💾</span>
              <span class="spinner-small" *ngIf="isSaving"></span>
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Permissions Section -->
      <div class="settings-section">
        <h3 class="subsection-title">Permissions</h3>
        <div class="permissions-card">
          <div class="permission-item">
            <div class="permission-content">
              <div class="permission-title">👨‍👩‍👧‍👦 Membres peuvent voir les transactions</div>
              <div class="permission-description">Tous les membres peuvent consulter l'historique des transactions</div>
            </div>
            <label class="switch">
              <input type="checkbox" checked disabled>
              <span class="slider"></span>
            </label>
          </div>

          <div class="permission-item">
            <div class="permission-content">
              <div class="permission-title">💰 Enfants peuvent créer des transactions</div>
              <div class="permission-description">Les enfants peuvent ajouter leurs propres dépenses</div>
            </div>
            <label class="switch">
              <input type="checkbox" disabled>
              <span class="slider"></span>
            </label>
          </div>

          <div class="info-box">
            <span class="info-icon">ℹ️</span>
            <p class="info-text">La gestion des permissions sera disponible prochainement</p>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section danger-section">
        <h3 class="subsection-title danger-title">Zone dangereuse</h3>
        <div class="danger-card">
          <div class="danger-content">
            <div class="danger-title-text">🗑️ Supprimer la famille</div>
            <p class="danger-description">
              Cette action est irréversible. Toutes les données (transactions, budgets, catégories) seront définitivement supprimées.
            </p>
          </div>
          <button class="btn-danger" (click)="confirmDelete()">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 1.5rem;
      max-width: 900px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2rem 0;
    }

    .settings-section {
      margin-bottom: 2rem;
    }

    .subsection-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .form-card, .permissions-card, .danger-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-of-type {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-textarea {
      resize: vertical;
    }

    .form-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn-save {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 1.125rem;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Permissions */
    .permission-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      gap: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .permission-item:last-of-type {
      border-bottom: none;
      margin-bottom: 1rem;
    }

    .permission-content {
      flex: 1;
    }

    .permission-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .permission-description {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Toggle Switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.3s;
      border-radius: 28px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    input:disabled + .slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Info Box */
    .info-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
    }

    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .info-text {
      margin: 0;
      color: #1e40af;
      font-size: 0.9rem;
    }

    /* Danger Zone */
    .danger-section {
      border-top: 2px solid #fee2e2;
      padding-top: 2rem;
    }

    .danger-title {
      color: #dc2626;
    }

    .danger-card {
      border-color: #fecaca;
      background: #fef2f2;
    }

    .danger-content {
      margin-bottom: 1rem;
    }

    .danger-title-text {
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 0.5rem;
      font-size: 1.125rem;
    }

    .danger-description {
      color: #7f1d1d;
      margin: 0;
      font-size: 0.95rem;
    }

    .btn-danger {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .permission-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .form-actions {
        justify-content: stretch;
      }

      .btn-save {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FamilySettingsComponent implements OnInit {
  family: Family | null = null;
  isSaving = false;

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFamily();
  }

  loadFamily(): void {
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        // Create a copy to avoid direct mutation
        this.family = { ...family };
      }
    });
  }

  saveFamily(): void {
    if (!this.family) return;

    this.isSaving = true;
    this.familyService.updateFamily(this.family.id, this.family).subscribe({
      next: () => {
        this.isSaving = false;
        alert('✅ Modifications enregistrées avec succès !');
      },
      error: (err) => {
        console.error('Erreur sauvegarde famille', err);
        this.isSaving = false;
        alert('❌ Erreur lors de l\'enregistrement');
      }
    });
  }

  confirmDelete(): void {
    if (!this.family) return;

    const confirmed = confirm(
      `⚠️ ATTENTION !\n\n` +
      `Êtes-vous sûr de vouloir supprimer la famille "${this.family.name}" ?\n\n` +
      `Cette action est IRRÉVERSIBLE et supprimera :\n` +
      `- Tous les membres\n` +
      `- Toutes les transactions\n` +
      `- Tous les budgets\n` +
      `- Toutes les catégories\n\n` +
      `Tapez le nom de la famille pour confirmer.`
    );

    if (!confirmed) return;

    const familyName = prompt(`Tapez "${this.family.name}" pour confirmer la suppression :`);
    
    if (familyName === this.family.name) {
      this.deleteFamily();
    } else if (familyName !== null) {
      alert('❌ Le nom ne correspond pas. Suppression annulée.');
    }
  }

  deleteFamily(): void {
    if (!this.family) return;

    this.familyService.deleteFamily(this.family.id).subscribe({
      next: () => {
        alert('✅ Famille supprimée avec succès');
        this.router.navigate(['/families']);
      },
      error: (err) => {
        console.error('Erreur suppression famille', err);
        alert('❌ Erreur lors de la suppression');
      }
    });
  }
}
