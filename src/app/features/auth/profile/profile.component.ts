import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

/**
 * ProfileComponent - Page de profil utilisateur
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  loadingProfile = false;
  loadingPassword = false;
  
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
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
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmNewPassword = form.get('confirmNewPassword');
    
    if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid) {
      this.loadingProfile = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: () => {
          this.loadingProfile = false;
          this.successMessage = 'Profil mis à jour avec succès';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loadingProfile = false;
          this.errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
        }
      });
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.loadingPassword = true;
      this.passwordSuccessMessage = '';
      this.passwordErrorMessage = '';

      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.loadingPassword = false;
          this.passwordSuccessMessage = 'Mot de passe changé avec succès';
          this.passwordForm.reset();
          setTimeout(() => this.passwordSuccessMessage = '', 3000);
        },
        error: (error) => {
          this.loadingPassword = false;
          this.passwordErrorMessage = error.message || 'Erreur lors du changement de mot de passe';
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
