import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

interface Tab {
  label: string;
  route: string;
  icon: string;
}

/**
 * ProfileComponent - Page de profil utilisateur avec onglets
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;

  tabs: Tab[] = [
    { label: 'Mon profil', route: '/profile', icon: '👤' },
    { label: 'Mes familles', route: '/profile/families', icon: '🏘️' },
    { label: 'Invitations', route: '/profile/invitations', icon: '📬' },
    { label: 'Sécurité', route: '/profile/security', icon: '🔐' }
  ];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isActiveTab(route: string): boolean {
    // Exact match for profile base route
    if (route === '/profile') {
      return this.router.url === '/profile';
    }
    // Starts with for sub-routes
    return this.router.url.startsWith(route);
  }

  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }
}
