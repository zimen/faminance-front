import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="security-container">
      <h2 class="section-title">Sécurité</h2>

      <!-- Change Password Section -->
      <div class="security-section">
        <h3 class="subsection-title">Changer de mot de passe</h3>
        
        <div class="form-card">
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label class="form-label">Mot de passe actuel</label>
              <input 
                type="password" 
                class="form-input"
                formControlName="currentPassword"
                placeholder="Entrez votre mot de passe actuel"
              />
              <div class="form-error" *ngIf="passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.errors">
                <span *ngIf="passwordForm.get('currentPassword')?.errors?.['required']">Le mot de passe actuel est requis</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nouveau mot de passe</label>
              <input 
                type="password" 
                class="form-input"
                formControlName="newPassword"
                placeholder="Minimum 6 caractères"
              />
              <div class="form-error" *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.errors">
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">Le nouveau mot de passe est requis</span>
                <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Minimum 6 caractères</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirmer le nouveau mot de passe</label>
              <input 
                type="password" 
                class="form-input"
                formControlName="confirmNewPassword"
                placeholder="Retapez le nouveau mot de passe"
              />
              <div class="form-error" *ngIf="passwordForm.get('confirmNewPassword')?.touched && passwordForm.errors?.['passwordMismatch']">
                Les mots de passe ne correspondent pas
              </div>
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
                class="btn-primary"
                [disabled]="!passwordForm.valid || isLoading">
                <span class="btn-icon" *ngIf="!isLoading">🔐</span>
                <span class="spinner-small" *ngIf="isLoading"></span>
                {{ isLoading ? 'Modification...' : 'Modifier le mot de passe' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2FA Section (Future) -->
      <div class="security-section">
        <h3 class="subsection-title">Authentification à deux facteurs</h3>
        
        <div class="info-card">
          <div class="info-icon">🔐</div>
          <div class="info-content">
            <h4 class="info-title">Renforcez la sécurité de votre compte</h4>
            <p class="info-description">
              L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire en demandant un code unique à chaque connexion.
            </p>
            <button class="btn-secondary" disabled>
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>

      <!-- Active Sessions (Future) -->
      <div class="security-section">
        <h3 class="subsection-title">Sessions actives</h3>
        
        <div class="info-card">
          <div class="info-icon">📱</div>
          <div class="info-content">
            <h4 class="info-title">Gérez vos appareils connectés</h4>
            <p class="info-description">
              Consultez et gérez les appareils sur lesquels vous êtes actuellement connecté.
            </p>
            <button class="btn-secondary" disabled>
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .security-container {
      padding: 1.5rem;
      max-width: 800px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2rem 0;
    }

    .security-section {
      margin-bottom: 2rem;
    }

    .subsection-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .form-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
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

    .btn-primary {
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

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.625rem 1.25rem;
      background: white;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
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

    .info-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
    }

    .info-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .info-content {
      flex: 1;
    }

    .info-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .info-description {
      color: #64748b;
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .security-container {
        padding: 1rem;
      }

      .info-card {
        flex-direction: column;
      }

      .form-actions {
        justify-content: stretch;
      }

      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ProfileSecurityComponent implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmNewPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Mot de passe modifié avec succès !';
        this.passwordForm.reset();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err: unknown) => {
        this.isLoading = false;
        this.errorMessage = (err as any).error?.message || 'Erreur lors de la modification du mot de passe';
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }
}
