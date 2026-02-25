import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';

/**
 * FamilyCreateComponent - Création d'une nouvelle famille
 */
@Component({
  selector: 'app-family-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './family-create.component.html',
  styleUrls: ['./family-create.component.css']
})
export class FamilyCreateComponent {
  familyForm: FormGroup;
  loading = false;
  errorMessage = '';

  // Couleurs prédéfinies
  private readonly defaultColors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ];

  constructor(
    private fb: FormBuilder,
    private familyService: FamilyService,
    private router: Router
  ) {
    // Sélectionner une couleur aléatoire par défaut
    const randomColor = this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];

    this.familyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      color: [randomColor, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.familyForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.familyService.createFamily(this.familyForm.value).subscribe({
        next: (family) => {
          // La famille est automatiquement sélectionnée par le service
          // Rediriger vers la liste ou le dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Erreur lors de la création de la famille';
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.familyForm.controls).forEach(key => {
        this.familyForm.get(key)?.markAsTouched();
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/families']);
  }
}
