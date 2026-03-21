import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarItem, SidebarSection } from './sidebar-item.model';
import { FamilyService } from '../../core/services/family.service';
import { InvitationService } from '../../core/services/invitation.service';
import { InvitationStatus } from '../../core/models/invitation.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  sections: SidebarSection[] = [];
  currentFamilyName: string = '';
  
  // Badge counts
  receivedInvitationsCount: number = 0;
  sentInvitationsCount: number = 0;
  familiesCount: number = 0;

  constructor(
    private router: Router,
    private familyService: FamilyService,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    // Load badge counts
    this.loadBadgeCounts();
    
    // S'abonner à la famille sélectionnée
    this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamilyName = family?.name || 'Aucune famille';
      this.buildSidebarStructure();
    });
  }
  
  loadBadgeCounts(): void {
    // Load received invitations count
    this.invitationService.getMyInvitations().subscribe({
      next: (invitations) => {
        this.receivedInvitationsCount = invitations.filter(
          inv => inv.status === InvitationStatus.PENDING
        ).length;
        this.buildSidebarStructure();
      },
      error: (err) => console.error('Error loading received invitations:', err)
    });
    
    // Load sent invitations count for current family
    this.familyService.selectedFamily$.subscribe(family => {
      if (family?.id) {
        this.invitationService.getFamilyInvitations(family.id).subscribe({
          next: (invitations) => {
            this.sentInvitationsCount = invitations.filter(
              inv => inv.status === InvitationStatus.PENDING
            ).length;
            this.buildSidebarStructure();
          },
          error: (err) => console.error('Error loading family invitations:', err)
        });
      }
    });
    
    // Load families count
    this.familyService.getMyFamilies().subscribe({
      next: (families) => {
        this.familiesCount = families.length;
        this.buildSidebarStructure();
      },
      error: (err) => console.error('Error loading families:', err)
    });
  }

  buildSidebarStructure(): void {
    this.sections = [
      // Section Dashboard
      {
        items: [
          {
            label: 'Dashboard',
            icon: '🏠',
            route: '/dashboard'
          }
        ]
      },
      // Section Finances
      {
        title: 'GESTION FINANCIÈRE',
        items: [
          {
            label: 'Transactions',
            icon: '📊',
            route: '/transactions'
          },
          {
            label: 'Budgets',
            icon: '💼',
            route: '/budgets'
          },
          {
            label: 'Catégories',
            icon: '🔖',
            route: '/categories'
          }
        ]
      },
      // Section Famille
      {
        title: `MA FAMILLE`,
        items: [
          {
            label: this.currentFamilyName,
            icon: '👥',
            route: '/family',
            children: [
              {
                label: 'Vue d\'ensemble',
                icon: '📋',
                route: '/family/overview'
              },
              {
                label: 'Membres',
                icon: '👨‍👩‍👧‍👦',
                route: '/family/members'
              },
              {
                label: 'Invitations',
                icon: '📨',
                route: '/family/invitations',
                badge: this.sentInvitationsCount
              },
              {
                label: 'Paramètres',
                icon: '⚙️',
                route: '/family/settings'
              }
            ]
          }
        ]
      },
      // Section Compte
      {
        title: 'MON COMPTE',
        items: [
          {
            label: 'Profil',
            icon: '👤',
            route: '/profile'
          },
          {
            label: 'Mes Familles',
            icon: '🏘️',
            route: '/profile/families',
            badge: this.familiesCount
          },
          {
            label: 'Rejoindre une famille',
            icon: '🔑',
            route: '/join'
          },
          {
            label: 'Invitations reçues',
            icon: '📬',
            route: '/profile/invitations',
            badge: this.receivedInvitationsCount
          },
          {
            label: 'Sécurité',
            icon: '🔐',
            route: '/profile/security'
          }
        ]
      }
    ];
  }

  toggleItem(item: SidebarItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    
    // Pour '/profile', vérifier match exact (éviter de matcher /profile/families, etc.)
    if (route === '/profile') {
      return this.router.url === '/profile';
    }
    
    // Pour les autres routes, permettre les sous-routes
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
