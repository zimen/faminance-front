import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-onboarding-complete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-complete.component.html',
  styleUrls: ['./onboarding-complete.component.css']
})
export class OnboardingCompleteComponent {
  constructor(
    private onboardingService: OnboardingService,
    private router: Router
  ) {
    // S'assurer que l'onboarding est marqué comme complété
    this.onboardingService.markOnboardingComplete();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
