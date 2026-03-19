import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FamilyService } from '../../core/services/family.service';
import { Family } from '../../core/models/family.model';

interface Tab {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.css']
})
export class FamilyComponent implements OnInit {
  family: Family | null = null;
  private selectedFamilyId: number | null = null;

  tabs: Tab[] = [
    { label: 'Vue d\'ensemble', route: '/family/overview', icon: '📋' },
    { label: 'Membres', route: '/family/members', icon: '👨‍👩‍👧‍👦' },
    { label: 'Invitations', route: '/family/invitations', icon: '📨' },
    { label: 'Paramètres', route: '/family/settings', icon: '⚙️' }
  ];

  constructor(
    private familyService: FamilyService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.familyService.selectedFamily$.subscribe(family => {
      if (family) {
        this.selectedFamilyId = family.id;
        this.loadFamilyDetails();
      }
    });
  }

  loadFamilyDetails(): void {
    if (!this.selectedFamilyId) return;

    this.familyService.getFamilyById(this.selectedFamilyId).subscribe({
      next: (family) => {
        this.family = family;
      },
      error: (err) => console.error('Erreur chargement famille', err)
    });
  }

  isActiveTab(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route);
  }
}
