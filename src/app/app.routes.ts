import { Routes } from '@angular/router';
import { authGuard, parentGuard } from './core/guards';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { onboardingCompleteGuard } from './core/guards/onboarding-complete.guard';

// Auth Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/auth/profile/profile.component';

// Onboarding Components
import { Step1RegisterComponent } from './features/onboarding/step1-register/step1-register.component';
import { Step2FamilySetupComponent } from './features/onboarding/step2-family-setup/step2-family-setup.component';
import { Step3CategoriesComponent } from './features/onboarding/step3-categories/step3-categories.component';
import { Step4FirstTransactionComponent } from './features/onboarding/step4-first-transaction/step4-first-transaction.component';
import { OnboardingCompleteComponent } from './features/onboarding/onboarding-complete/onboarding-complete.component';

// Family Components
import { FamilyListComponent } from './features/families/family-list/family-list.component';
import { FamilyCreateComponent } from './features/families/family-create/family-create.component';
import { FamilyDetailComponent } from './features/families/family-detail/family-detail.component';

// Invitation Components
import { InvitationListComponent } from './features/invitations/invitation-list/invitation-list.component';
import { InvitationSendComponent } from './features/invitations/invitation-send/invitation-send.component';

// Existing Components (will be adapted)
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { BudgetComponent } from './components/budget/budget.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { BudgetTemplateComponent } from './components/budget-template/budget-template.component';

export const routes: Routes = [
  // Redirect root to login
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  
  // Onboarding routes (protected by onboardingGuard - redirect if already completed)
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    children: [
      { path: 'register', component: Step1RegisterComponent },
      { 
        path: 'family-setup', 
        component: Step2FamilySetupComponent,
        canActivate: [authGuard] // Must be authenticated
      },
      { 
        path: 'categories', 
        component: Step3CategoriesComponent,
        canActivate: [authGuard] // Must be authenticated
      },
      { 
        path: 'first-transaction', 
        component: Step4FirstTransactionComponent,
        canActivate: [authGuard] // Must be authenticated
      },
      { 
        path: 'complete', 
        component: OnboardingCompleteComponent,
        canActivate: [authGuard] // Must be authenticated
      },
      { path: '', redirectTo: 'register', pathMatch: 'full' }
    ]
  },

  // Auth routes (public)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  // Protected routes (require authentication + onboarding completion)
  {
    path: '',
    canActivate: [authGuard, onboardingCompleteGuard],
    children: [
      // Profile
      { path: 'profile', component: ProfileComponent },

      // Families
      { path: 'families', component: FamilyListComponent },
      { path: 'families/create', component: FamilyCreateComponent },
      { path: 'families/:id', component: FamilyDetailComponent },

      // Invitations
      { path: 'invitations', component: InvitationListComponent },
      { 
        path: 'invitations/send', 
        component: InvitationSendComponent,
        canActivate: [parentGuard] // Only PARENT and ADMIN can invite
      },

      // Dashboard & Features
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { 
        path: 'budgets', 
        component: BudgetComponent,
        canActivate: [parentGuard] // Only PARENT and ADMIN can manage budgets
      },
      { 
        path: 'budget-templates', 
        component: BudgetTemplateComponent,
        canActivate: [parentGuard] // Only PARENT and ADMIN can manage budget templates
      },
      { 
        path: 'categories', 
        component: CategoriesComponent,
        canActivate: [parentGuard] // Only PARENT and ADMIN can manage categories
      },

      // Default redirect for authenticated users
      { path: '**', redirectTo: '/families' }
    ]
  }
];
