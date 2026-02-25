import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FamilyService } from '../../../core/services/family.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { Family, FamilyMember, FamilyRole } from '../../../core/models';
import { MemberAvatarComponent } from '../../../shared/components/member-avatar/member-avatar.component';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge.component';

/**
 * FamilyDetailComponent - Détails d'une famille avec gestion des membres
 */
@Component({
  selector: 'app-family-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MemberAvatarComponent, RoleBadgeComponent],
  templateUrl: './family-detail.component.html',
  styleUrls: ['./family-detail.component.css']
})

export class FamilyDetailComponent implements OnInit {
  family?: Family;
  members: FamilyMember[] = [];
  loading = true;
  loadingMembers = true;
  successMessage = '';
  errorMessage = '';
  currentUserId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private familyService: FamilyService,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    const familyId = Number(this.route.snapshot.paramMap.get('id'));
    if (familyId) {
      this.loadFamily(familyId);
      this.loadMembers(familyId);
    }
  }

  loadFamily(id: number): void {
    this.loading = true;
    this.familyService.getFamilyById(id).subscribe({
      next: family => {
        this.family = family;
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage = error.message || 'Erreur lors du chargement de la famille';
      }
    });
  }

  loadMembers(familyId: number): void {
    this.loadingMembers = true;
    this.familyService.getFamilyMembers(familyId).subscribe({
      next: members => {
        this.members = members;
        this.loadingMembers = false;
      },
      error: error => {
        this.loadingMembers = false;
        this.errorMessage = error.message || 'Erreur lors du chargement des membres';
      }
    });
  }

  canInvite(): boolean {
    return this.family?.myRole === FamilyRole.ADMIN || this.family?.myRole === FamilyRole.PARENT;
  }

  canManageMembers(): boolean {
    return this.family?.myRole === FamilyRole.ADMIN || this.family?.myRole === FamilyRole.PARENT;
  }

  isAdmin(): boolean {
    return this.family?.myRole === FamilyRole.ADMIN;
  }

  changeRole(member: FamilyMember): void {
    // Cycle through roles: MEMBER -> PARENT -> ADMIN -> MEMBER
    const roles = [FamilyRole.MEMBER, FamilyRole.PARENT, FamilyRole.ADMIN];
    const currentIndex = roles.indexOf(member.role);
    const newRole = roles[(currentIndex + 1) % roles.length];

    if (this.family && confirm(`Changer le rôle de ${member.fullName} en ${newRole} ?`)) {
      this.familyService.updateMemberRole(this.family.id, member.id, newRole).subscribe({
        next: () => {
          this.successMessage = 'Rôle mis à jour avec succès';
          this.loadMembers(this.family!.id);
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: error => {
          this.errorMessage = error.message || 'Erreur lors de la mise à jour du rôle';
        }
      });
    }
  }

  removeMember(member: FamilyMember): void {
    if (this.family && confirm(`Retirer ${member.fullName} de la famille ?`)) {
      this.familyService.removeMember(this.family.id, member.id).subscribe({
        next: () => {
          this.successMessage = 'Membre retiré avec succès';
          this.loadMembers(this.family!.id);
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: error => {
          this.errorMessage = error.message || 'Erreur lors du retrait du membre';
        }
      });
    }
  }

  editFamily(): void {
    // TODO: Implémenter l'édition de famille
    alert('Fonctionnalité à venir');
  }

  deleteFamily(): void {
    if (this.family && confirm(`Êtes-vous sûr de vouloir supprimer la famille "${this.family.name}" ? Cette action est irréversible.`)) {
      this.familyService.deleteFamily(this.family.id).subscribe({
        next: () => {
          this.router.navigate(['/families']);
        },
        error: error => {
          this.errorMessage = error.message || 'Erreur lors de la suppression de la famille';
        }
      });
    }
  }

  leaveFamily(): void {
    if (this.family && confirm(`Êtes-vous sûr de vouloir quitter la famille "${this.family.name}" ?`)) {
      this.familyService.leaveFamily(this.family.id).subscribe({
        next: () => {
          this.router.navigate(['/families']);
        },
        error: error => {
          this.errorMessage = error.message || 'Erreur lors de la sortie de la famille';
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/families']);
  }
}
