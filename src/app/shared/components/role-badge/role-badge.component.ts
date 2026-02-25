import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyRole } from '../../../core/models';

/**
 * RoleBadgeComponent - Badge affichant le rôle d'un membre
 */
@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="role-badge" 
      [class.role-admin]="role === 'ADMIN'"
      [class.role-parent]="role === 'PARENT'"
      [class.role-member]="role === 'MEMBER'"
    >
      {{ roleName }}
    </span>
  `,
  styles: [`
    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .role-admin {
      background-color: #fed7d7;
      color: #c53030;
    }

    .role-parent {
      background-color: #bee3f8;
      color: #2c5282;
    }

    .role-member {
      background-color: #c6f6d5;
      color: #22543d;
    }
  `]
})
export class RoleBadgeComponent {
  @Input() role: FamilyRole = FamilyRole.MEMBER;

  get roleName(): string {
    const roleNames: Record<FamilyRole, string> = {
      [FamilyRole.ADMIN]: 'Admin',
      [FamilyRole.PARENT]: 'Parent',
      [FamilyRole.MEMBER]: 'Membre'
    };
    return roleNames[this.role] || 'Membre';
  }
}
