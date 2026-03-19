import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-info-container">
      <h2 class="section-title">Informations personnelles</h2>

      <div class="profile-card" *ngIf="currentUser">
        <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
          <div class="form-group">
            <label class="form-label">Nom d'utilisateur</label>
            <input 
              type="text" 
              class="form-input"
              formControlName="username"
              placeholder="Votre nom d'utilisateur"
            />
            <div class="form-error" *ngIf="profileForm.get('username')?.touched && profileForm.get('username')?.errors">
              <span *ngIf="profileForm.get('username')?.errors?.['required']">Le nom d'utilisateur est requis</span>
              <span *ngIf="profileForm.get('username')?.errors?.['minlength']">Minimum 3 caractères</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              class="form-input"
              formControlName="email"
              placeholder="votre@email.com"
            />
            <div class="form-error" *ngIf="profileForm.get('email')?.touched && profileForm.get('email')?.errors">
              <span *ngIf="profileForm.get('email')?.errors?.['required']">L'email est requis</span>
              <span *ngIf="profileForm.get('email')?.errors?.['email']">Email invalide</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Prénom (optionnel)</label>
            <input 
              type="text" 
              class="form-input"
              formControlName="firstName"
              placeholder="Votre prénom"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Nom (optionnel)</label>
            <input 
              type="text" 
              class="form-input"
              formControlName="lastName"
              placeholder="Votre nom"
            />
          </div>

          <div class="alert alert-success" *ngIf="successMessage">
            ✅ {{ successMessage }}
          </div>

          <div class="alert alert-error" *ngIf="errorMessage">
            ❌ {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-save"
              [disabled]="!profileForm.valid || !profileForm.dirty || isLoading">
              <span class="btn-icon" *ngIf="!isLoading">💾</span>
              <span class="spinner-small" *ngIf="isLoading"></span>
              {{ isLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Account Information -->
      <div class="info-section" *ngIf="currentUser">
        <h3 class="subsection-title">Informations du compte</h3>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Statut :</span>
            <span class="info-badge" [class.badge-active]="currentUser.active" [class.badge-inactive]="!currentUser.active">
              {{ currentUser.active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="info-row" *ngIf="currentUser.emailVerified !== undefined">
            <span class="info-label">Email vérifié :</span>
            <span class="info-badge" [class.badge-verified]="currentUser.emailVerified" [class.badge-pending]="!currentUser.emailVerified">
              {{ currentUser.emailVerified ? 'Vérifié' : 'En attente' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Membre depuis</span>
            <span class="info-value">Janvier 2024</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-info-container {
      padding: 1.5rem;
      max-width: 800px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1.5rem 0;
    }

    .subsection-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .profile-card, .info-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
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

    .info-section {
      margin-top: 2rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #475569;
    }

    .info-value {
      color: #1e293b;
    }

    .info-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-active {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-verified {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    @media (max-width: 768px) {
      .profile-info-container {
        padding: 1rem;
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
export class ProfileInfoComponent implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: ['']
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        });
        // Mark as pristine after initial load
        this.profileForm.markAsPristine();
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Profil mis à jour avec succès !';
        this.profileForm.markAsPristine();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil';
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }
}
