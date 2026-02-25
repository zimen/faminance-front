# Guide d'Adaptation des Composants Existants

Ce guide explique comment adapter vos composants existants (transactions, budgets, categories, dashboard) pour fonctionner avec le nouveau système multi-familles.

## 📝 Pattern Général

Tous les composants doivent maintenant:
1. **Injecter** `FamilyService`
2. **S'abonner** à `selectedFamily$` pour obtenir la famille active
3. **Passer** le `familyId` à tous les appels API
4. **Gérer** le cas où aucune famille n'est sélectionnée

## 🔄 Exemple: Adapter TransactionsComponent

### ❌ AVANT (version simple)
```typescript
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactionService.getAll().subscribe(transactions => {
      this.transactions = transactions;
    });
  }

  createTransaction(data: TransactionRequest): void {
    this.transactionService.create(data).subscribe(() => {
      this.loadTransactions();
    });
  }
}
```

### ✅ APRÈS (version multi-familles)
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { FamilyService } from '../../core/services/family.service';
import { Transaction, Family, FamilyMember } from '../../core/models';
import { MemberAvatarComponent } from '../../shared/components/member-avatar/member-avatar.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MemberAvatarComponent, /* ... autres imports ... */],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  members: FamilyMember[] = [];
  currentFamily?: Family;
  loading = false;
  errorMessage = '';

  private familySubscription?: Subscription;

  constructor(
    private transactionService: TransactionService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de famille sélectionnée
    this.familySubscription = this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamily = family;
      if (family) {
        this.loadTransactions(family.id);
        this.loadMembers(family.id);
      } else {
        this.transactions = [];
      }
    });
  }

  ngOnDestroy(): void {
    // Ne pas oublier de se désabonner !
    this.familySubscription?.unsubscribe();
  }

  loadTransactions(familyId: number): void {
    this.loading = true;
    this.transactionService.getTransactions(familyId).subscribe({
      next: transactions => {
        this.transactions = transactions;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  loadMembers(familyId: number): void {
    this.familyService.getFamilyMembers(familyId).subscribe({
      next: members => this.members = members,
      error: error => console.error('Erreur membres:', error)
    });
  }

  createTransaction(data: TransactionRequest): void {
    if (!this.currentFamily) {
      this.errorMessage = 'Aucune famille sélectionnée';
      return;
    }

    this.transactionService.createTransaction(this.currentFamily.id, data).subscribe({
      next: () => {
        this.loadTransactions(this.currentFamily!.id);
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = error.message || 'Erreur lors de la création';
      }
    });
  }

  deleteTransaction(transactionId: number): void {
    if (!this.currentFamily) return;

    if (confirm('Supprimer cette transaction ?')) {
      this.transactionService.deleteTransaction(this.currentFamily.id, transactionId).subscribe({
        next: () => this.loadTransactions(this.currentFamily!.id),
        error: error => this.errorMessage = error.message
      });
    }
  }
}
```

### 📝 Template Adapté
```html
<!-- Pas de famille sélectionnée -->
<div *ngIf="!currentFamily" class="no-family">
  <h2>Aucune famille sélectionnée</h2>
  <p>Veuillez sélectionner une famille dans le menu ci-dessus.</p>
  <button routerLink="/families">Voir mes familles</button>
</div>

<!-- Famille sélectionnée -->
<div *ngIf="currentFamily" class="transactions-container">
  <div class="header">
    <h1>Transactions - {{ currentFamily.name }}</h1>
    <button (click)="openCreateDialog()">+ Nouvelle Transaction</button>
  </div>

  <div *ngIf="loading">Chargement...</div>

  <div *ngIf="errorMessage" class="alert error">{{ errorMessage }}</div>

  <table *ngIf="!loading">
    <thead>
      <tr>
        <th>Date</th>
        <th>Membre</th>
        <th>Description</th>
        <th>Catégorie</th>
        <th>Montant</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let transaction of transactions">
        <td>{{ transaction.date | date:'dd/MM/yyyy' }}</td>
        <td>
          <!-- Utiliser le composant MemberAvatar -->
          <app-member-avatar
            [name]="transaction.familyMember?.fullName || transaction.familyMember?.username || ''"
            [avatarUrl]="transaction.familyMember?.avatarUrl"
            [color]="transaction.familyMember?.color || '#667eea'"
            [size]="32"
          ></app-member-avatar>
        </td>
        <td>{{ transaction.description }}</td>
        <td>{{ transaction.category?.icon }} {{ transaction.category?.name }}</td>
        <td [class.income]="transaction.type === 'INCOME'" [class.expense]="transaction.type === 'EXPENSE'">
          {{ transaction.amount | currency:'EUR' }}
        </td>
        <td>
          <button (click)="editTransaction(transaction)">✏️</button>
          <button (click)="deleteTransaction(transaction.id!)">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## 🎯 Adapter BudgetComponent

```typescript
export class BudgetComponent implements OnInit, OnDestroy {
  budgets: Budget[] = [];
  currentFamily?: Family;
  canManage = false; // Vérifie si PARENT ou ADMIN
  private familySubscription?: Subscription;

  constructor(
    private budgetService: BudgetService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    this.familySubscription = this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamily = family;
      this.canManage = this.familyService.hasMinRole(FamilyRole.PARENT);
      if (family) {
        this.loadBudgets(family.id);
      }
    });
  }

  loadBudgets(familyId: number): void {
    this.budgetService.getBudgets(familyId).subscribe({
      next: budgets => this.budgets = budgets,
      error: error => console.error(error)
    });
  }

  createBudget(data: BudgetRequest): void {
    if (!this.currentFamily || !this.canManage) return;
    
    this.budgetService.createBudget(this.currentFamily.id, data).subscribe({
      next: () => this.loadBudgets(this.currentFamily!.id),
      error: error => console.error(error)
    });
  }

  ngOnDestroy(): void {
    this.familySubscription?.unsubscribe();
  }
}
```

## 📊 Adapter DashboardComponent

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  statistics?: Statistics;
  currentFamily?: Family;
  private familySubscription?: Subscription;

  constructor(
    private statisticsService: StatisticsService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    this.familySubscription = this.familyService.selectedFamily$.subscribe(family => {
      this.currentFamily = family;
      if (family) {
        this.loadStatistics(family.id);
      }
    });
  }

  loadStatistics(familyId: number): void {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    this.statisticsService.getStatistics(familyId, startDate, endDate).subscribe({
      next: stats => this.statistics = stats,
      error: error => console.error(error)
    });
  }

  ngOnDestroy(): void {
    this.familySubscription?.unsubscribe();
  }
}
```

Template:
```html
<div *ngIf="currentFamily && statistics" class="dashboard">
  <h1>Tableau de Bord - {{ currentFamily.name }}</h1>
  
  <!-- Indicateur de rôle -->
  <div class="user-role">
    <span>Votre rôle:</span>
    <app-role-badge [role]="currentFamily.myRole"></app-role-badge>
  </div>

  <!-- Stats globales -->
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Revenus</h3>
      <p class="amount income">{{ statistics.totalIncome | currency:'EUR' }}</p>
    </div>
    <div class="stat-card">
      <h3>Dépenses</h3>
      <p class="amount expense">{{ statistics.totalExpense | currency:'EUR' }}</p>
    </div>
    <div class="stat-card">
      <h3>Solde</h3>
      <p class="amount" [class.positive]="statistics.balance >= 0" [class.negative]="statistics.balance < 0">
        {{ statistics.balance | currency:'EUR' }}
      </p>
    </div>
  </div>

  <!-- Stats par membre -->
  <div class="members-stats">
    <h2>Dépenses par membre</h2>
    <div *ngFor="let memberStat of statistics.memberBreakdown" class="member-stat">
      <app-member-avatar
        [name]="memberStat.memberName"
        [avatarUrl]="memberStat.memberAvatar"
        [color]="memberStat.memberColor"
        [size]="40"
      ></app-member-avatar>
      <div class="member-details">
        <span class="name">{{ memberStat.memberName }}</span>
        <span class="amount">{{ memberStat.totalExpense | currency:'EUR' }}</span>
      </div>
    </div>
  </div>
</div>
```

## ✅ Checklist d'Adaptation

Pour chaque composant existant:

- [ ] Importer `FamilyService`
- [ ] Ajouter propriété `currentFamily?: Family`
- [ ] Ajouter subscription `familySubscription?: Subscription`
- [ ] S'abonner à `selectedFamily$` dans `ngOnInit()`
- [ ] Implémenter `OnDestroy` et se désabonner
- [ ] Passer `familyId` à tous les appels de service
- [ ] Gérer le cas `!currentFamily` dans le template
- [ ] Utiliser `MemberAvatarComponent` pour afficher les membres
- [ ] Utiliser `RoleBadgeComponent` pour afficher les rôles
- [ ] Vérifier les permissions avant actions sensibles
- [ ] Tester avec plusieurs familles

## 🔐 Vérification des Permissions

```typescript
// Dans le composant
canEdit(): boolean {
  return this.familyService.hasMinRole(FamilyRole.PARENT);
}

canDelete(): boolean {
  return this.familyService.hasRole(FamilyRole.ADMIN);
}

// Dans le template
<button *ngIf="canEdit()" (click)="edit()">Modifier</button>
<button *ngIf="canDelete()" (click)="delete()">Supprimer</button>
```

## 🎨 Import des Composants Shared

```typescript
import { MemberAvatarComponent } from '../../shared/components/member-avatar/member-avatar.component';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

@Component({
  // ...
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MemberAvatarComponent,
    RoleBadgeComponent,
    // ... autres imports
  ]
})
```

## ⚠️ Erreurs Courantes

1. **Oublier de se désabonner** → Memory leaks
   - Solution: Implémenter `OnDestroy` et appeler `unsubscribe()`

2. **Ne pas gérer `!currentFamily`** → Erreurs runtime
   - Solution: Ajouter vérifications et afficher message approprié

3. **Ne pas passer le `familyId`** → Erreurs 400/404
   - Solution: Toujours passer `familyId` aux services

4. **Oublier d'importer les composants shared** dans `imports: []`
   - Solution: Ajouter `MemberAvatarComponent`, `RoleBadgeComponent`

---

Une fois adaptés, vos composants fonctionneront parfaitement avec le système multi-familles ! 🚀
