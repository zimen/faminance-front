import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { Family, FamilyRole } from '../../../core/models';

/**
 * InvitationSendComponent - Formulaire d'envoi d'invitation
 */
@Component({
  selector: 'app-invitation-send',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invitation-send.component.html',
  styleUrls: ['./invitation-send.component.css']
})
export class InvitationSendComponent implements OnInit {
  invitationForm: FormGroup;
  families: Family[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private familyService: FamilyService,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.invitationForm = this.fb.group({
      familyId: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      proposedRole: [FamilyRole.MEMBER, Validators.required],
      message: ['']
    });
  }

  ngOnInit(): void {
    this.loadFamilies();

    // Pré-remplir familyId si passé en query param
    const familyId = this.route.snapshot.queryParamMap.get('familyId');
    if (familyId) {
      this.invitationForm.patchValue({ familyId: Number(familyId) });
    }
  }

  loadFamilies(): void {
    this.familyService.getMyFamilies().subscribe({
      next: families => {
        // Ne garder que les familles où je peux inviter (ADMIN ou PARENT)
        this.families = families.filter(f => 
          f.myRole === FamilyRole.ADMIN || f.myRole === FamilyRole.PARENT
        );

        // Si une seule famille, la sélectionner automatiquement
        if (this.families.length === 1 && !this.invitationForm.get('familyId')?.value) {
          this.invitationForm.patchValue({ familyId: this.families[0].id });
        }
      },
      error: error => {
        this.errorMessage = error.message || 'Erreur lors du chargement des familles';
      }
    });
  }

  canAssignAdmin(): boolean {
    const familyId = this.invitationForm.get('familyId')?.value;
    if (!familyId) return false;
    
    const family = this.families.find(f => f.id === Number(familyId));
    return family?.myRole === FamilyRole.ADMIN;
  }

  onSubmit(): void {
    if (this.invitationForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = {
        ...this.invitationForm.value,
        familyId: Number(this.invitationForm.value.familyId)
      };

      this.invitationService.sendInvitation(formValue).subscribe({
        next: () => {
          this.router.navigate(['/invitations']);
        },
        error: error => {
          this.loading = false;
          this.errorMessage = error.message || 'Erreur lors de l\'envoi de l\'invitation';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/invitations']);
  }
}
