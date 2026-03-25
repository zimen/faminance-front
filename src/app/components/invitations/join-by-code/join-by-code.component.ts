import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { JoinByCodeRequest } from '../../../core/models/invitation.model';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-join-by-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './join-by-code.component.html',
  styleUrl: './join-by-code.component.css'
})
export class JoinByCodeComponent implements OnInit {
  codeForm!: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  success = false;
  joinedFamilyName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.codeForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.pattern(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i)
      ]]
    });
  }

  /**
   * Formate le code en temps réel (XXXX-XXXX en majuscules)
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Ajouter le tiret automatiquement après 4 caractères
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    
    this.codeForm.patchValue({ code: value }, { emitEvent: false });
    input.value = value;
  }

  /**
   * Soumet le formulaire pour rejoindre la famille
   */
  onSubmit(): void {
    if (this.codeForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.error = null;

    const request: JoinByCodeRequest = {
      joinCode: this.codeForm.value.code
    };

    this.familyService.joinFamilyByCode(request)
      .pipe(
        tap(response => {
          this.success = true;
          this.joinedFamilyName = response.name;
          this.isSubmitting = false;

          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }),
        catchError(error => {
          this.error = this.getErrorMessage(error);
          this.isSubmitting = false;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Extrait un message d'erreur lisible
   */
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Ce code d\'invitation n\'existe pas ou n\'est plus valide';
    }
    if (error.status === 400) {
      return error.error?.message || 'Le format du code est incorrect';
    }
    if (error.status === 409) {
      return 'Vous êtes déjà membre de cette famille';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Getter pour faciliter l'accès au contrôle code
   */
  get codeControl() {
    return this.codeForm.get('code');
  }

  /**
   * Vérifie si le code a le bon format
   */
  get isCodeValid(): boolean {
    return this.codeControl?.valid ?? false;
  }
}
