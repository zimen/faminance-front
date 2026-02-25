import { Routes } from '@angular/router';
import { authGuard, parentGuard } from './core/guards';

// Auth Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/auth/profile/profile.component';

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

export const routes: Routes = [
  // Redirect root to login
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  
  // Auth routes (public)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  // Protected routes (require authentication)
  {
    path: '',
    canActivate: [authGuard],
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
        path: 'categories', 
        component: CategoriesComponent,
        canActivate: [parentGuard] // Only PARENT and ADMIN can manage categories
      },

      // Default redirect for authenticated users
      { path: '**', redirectTo: '/families' }
    ]
  }
];
