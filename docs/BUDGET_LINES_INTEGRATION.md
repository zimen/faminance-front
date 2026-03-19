# Guide d'implémentation - Système de lignes budgétaires détaillées

## 🎯 Vue d'ensemble du système

Le système de lignes budgétaires permet une gestion financière granulaire en décomposant chaque catégorie budgétaire en lignes détaillées. Les transactions sont rattachées automatiquement ou manuellement aux lignes, permettant un suivi précis et des prévisions intelligentes.

---

## 📁 Architecture des fichiers

### Modèles créés
```
src/app/core/models/
├── budget-line.model.ts              ✅ Créé
├── budget-alert.model.ts             ✅ Créé
├── budget-forecast.model.ts          ✅ Créé
├── budget-template.model.ts          ✅ Modifié (enrichi avec lignes)
└── transaction.model.ts              ✅ Modifié (ajout budgetLineId)
```

### Services créés
```
src/app/core/services/
├── budget-line.service.ts            ✅ Créé
├── budget-alert.service.ts           ✅ Créé
├── budget-forecast.service.ts        ✅ Créé
└── budget-instance.service.ts        ✅ Créé
```

### Composants créés
```
src/app/components/
└── budget-line-manager/              ✅ Créé
    ├── budget-line-manager.component.ts
    ├── budget-line-manager.component.html
    └── budget-line-manager.component.css
```

### Documentation
```
docs/
└── BACKEND_BUDGET_LINES.md           ✅ Créé
```

---

## 🔄 Workflow complet

### 1. Création du template (une fois)

```typescript
// Exemple d'utilisation dans un composant
createTemplate() {
  const template: BudgetTemplateRequest = {
    name: "Budget Famille Mensuel",
    description: "Template standard pour le budget mensuel",
    isDefault: true,
    items: [
      {
        categoryId: 1, // Alimentation
        lines: [
          {
            label: "Courses semaine 1",
            plannedAmount: 120,
            recurrence: RecurrencePattern.WEEKLY,
            dayOfMonth: 5
          },
          {
            label: "Courses semaine 2",
            plannedAmount: 120,
            dayOfMonth: 12
          },
          {
            label: "Restaurants",
            plannedAmount: 50
          }
        ]
      },
      {
        categoryId: 2, // Transport
        lines: [
          {
            label: "Essence",
            plannedAmount: 120,
            recurrence: RecurrencePattern.MONTHLY,
            dayOfMonth: 10
          }
        ]
      }
    ]
  };
  
  this.budgetTemplateService.createTemplate(familyId, template)
    .subscribe(created => {
      console.log('Template créé:', created);
    });
}
```

### 2. Génération du budget mensuel

```typescript
// Générer le budget pour Mars 2026
generateBudget() {
  const month = 3;
  const year = 2026;
  
  this.budgetInstanceService.generateFromTemplate(familyId, templateId, month, year)
    .subscribe(budget => {
      console.log('Budget généré:', budget);
      // Le budget contient toutes les lignes du template
      // avec dates calculées automatiquement
    });
}
```

### 3. Création de transaction avec rattachement

```typescript
// Dans le composant de création de transaction
createTransaction() {
  // 1. Récupérer le budget actif
  this.budgetInstanceService.getActiveBudget(familyId)
    .subscribe(budget => {
      
      // 2. Suggérer les lignes appropriées
      this.budgetLineService.suggestBudgetLines(
        familyId,
        budget.id,
        this.transaction.categoryId,
        this.transaction.amount,
        this.transaction.date
      ).subscribe(suggestedLines => {
        
        // 3. Afficher les suggestions à l'utilisateur
        this.availableLines = suggestedLines;
      });
    });
}

saveTransaction() {
  const request: TransactionRequest = {
    categoryId: this.transaction.categoryId,
    budgetLineId: this.selectedBudgetLineId, // Ligne sélectionnée
    description: this.transaction.description,
    amount: this.transaction.amount,
    type: 'EXPENSE',
    date: this.transaction.date
  };
  
  this.transactionService.createTransaction(familyId, request)
    .subscribe(created => {
      // Le backend recalcule automatiquement les totaux
      console.log('Transaction créée et rattachée');
    });
}
```

### 4. Affichage avec alertes

```typescript
// Dans le composant de saisie de transaction
checkBudgetAlert() {
  if (this.selectedBudgetLine && this.proposedAmount) {
    const alert = this.budgetAlertService.checkTransactionAlert(
      this.selectedBudgetLine,
      this.proposedAmount
    );
    
    if (alert) {
      if (alert.severity === 'DANGER') {
        this.showDangerAlert(alert);
      } else if (alert.severity === 'WARNING') {
        this.showWarningAlert(alert);
      }
    }
  }
}

showDangerAlert(alert: BudgetAlert) {
  const confirmed = confirm(
    `⚠️ ${alert.message}\n\n` +
    `Suggestions:\n${alert.suggestions?.join('\n')}\n\n` +
    `Voulez-vous continuer ?`
  );
  
  if (!confirmed) {
    // Annuler la transaction
  }
}
```

### 5. Utilisation du composant Budget Line Manager

```html
<!-- Dans votre template de budget -->
<div *ngFor="let category of budget.categories">
  <app-budget-line-manager
    [budgetId]="budget.id"
    [categoryId]="category.categoryId"
    [categoryName]="category.categoryName"
    [categoryIcon]="category.categoryIcon"
    (linesChanged)="onLinesChanged()">
  </app-budget-line-manager>
</div>
```

---

## 🔔 Système d'alertes

### Configuration des règles

```typescript
// Créer une règle de notification
createNotificationRule() {
  const rule: Partial<BudgetNotificationRule> = {
    enabled: true,
    triggerType: 'PERCENTAGE',
    threshold: 80,
    scope: 'LINE',
    channels: ['IN_APP', 'EMAIL'],
    recipientMemberIds: [userId]
  };
  
  this.budgetAlertService.createNotificationRule(familyId, rule)
    .subscribe(created => {
      console.log('Règle créée:', created);
    });
}
```

### Vérification en temps réel

```typescript
// Avant de sauvegarder une transaction
checkAlert() {
  const line = this.selectedBudgetLine;
  const amount = this.transactionAmount;
  
  const alert = this.budgetAlertService.checkTransactionAlert(line, amount);
  
  if (alert) {
    switch (alert.trigger) {
      case BudgetAlertTrigger.EXCEEDED:
        // Afficher un message d'erreur critique
        break;
      case BudgetAlertTrigger.APPROACHING:
        // Afficher un avertissement
        break;
      case BudgetAlertTrigger.DEPLETED:
        // Informer l'utilisateur
        break;
    }
  }
}
```

---

## 📈 Prévisions et optimisation

### Prévisions de fin de mois

```typescript
showForecast() {
  this.budgetForecastService.getMonthEndForecast(familyId, budgetId)
    .subscribe(forecast => {
      console.log('Progression du mois:', forecast.overall.monthProgress + '%');
      console.log('Projection fin de mois:', forecast.overall.projectedEnd + '€');
      console.log('Écart prévu:', forecast.overall.projectedVariance + '€');
      
      // Afficher les catégories à risque
      forecast.byCategory
        .filter(c => c.riskLevel === 'HIGH')
        .forEach(cat => {
          console.warn(`⚠️ ${cat.categoryName}: risque élevé`);
        });
      
      // Afficher les recommandations
      forecast.recommendations.forEach(rec => {
        console.log('💡', rec);
      });
    });
}
```

### Suggestions d'optimisation

```typescript
showOptimizationSuggestions() {
  this.budgetForecastService.getOptimizationSuggestions(
    familyId,
    templateId,
    6 // 6 derniers mois
  ).subscribe(suggestions => {
    
    suggestions.forEach(sug => {
      console.log(`${sug.lineName}:`);
      console.log(`  Montant actuel: ${sug.current.planned}€`);
      console.log(`  Suggestion: ${sug.suggestion.newPlanned}€`);
      console.log(`  Raison: ${sug.suggestion.reason}`);
      console.log(`  Confiance: ${sug.suggestion.confidence}%`);
      
      if (sug.suggestion.savingsPotential) {
        console.log(`  💰 Économie: ${sug.suggestion.savingsPotential}€/mois`);
      }
    });
  });
}
```

### Comparaison multi-mois

```typescript
compareBudgets() {
  this.budgetForecastService.compareBudgets(
    familyId,
    1, 2026,  // Janvier 2026
    6, 2026   // Juin 2026
  ).subscribe(comparison => {
    
    console.log('Tendance:', comparison.trends.trend);
    console.log('Dépense mensuelle moyenne:', comparison.trends.averageMonthlySpending);
    
    // Afficher l'évolution mois par mois
    comparison.months.forEach(month => {
      console.log(`${month.name}: ${month.totalActual}€ (${month.compliance}% de respect)`);
    });
    
    // Top catégories
    comparison.topCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.categoryName}: ${cat.totalSpent}€`);
    });
  });
}
```

---

## 🔄 Détection de récurrence

```typescript
detectRecurringExpenses() {
  const lineLabel = "Netflix";
  
  this.budgetForecastService.detectRecurrence(familyId, lineLabel, 6)
    .subscribe(detection => {
      
      if (detection.detectedPattern) {
        console.log('Pattern détecté:', detection.detectedPattern.recurrence);
        console.log('Confiance:', detection.detectedPattern.confidence + '%');
        console.log('Montant moyen:', detection.detectedPattern.averageAmount + '€');
        
        if (detection.detectedPattern.dayOfMonth) {
          console.log('Jour du mois:', detection.detectedPattern.dayOfMonth);
        }
        
        // Proposer à l'utilisateur de créer une ligne récurrente
        if (detection.detectedPattern.confidence > 80) {
          const create = confirm(
            `Nous avons détecté un pattern récurrent pour "${lineLabel}".\n` +
            `Voulez-vous créer une ligne budgétaire automatique ?`
          );
          
          if (create) {
            this.createRecurringLine(detection);
          }
        }
      }
    });
}
```

---

## 🎨 Intégration UI

### Dans le formulaire de transaction

```html
<div class="transaction-form">
  <input [(ngModel)]="transaction.description" placeholder="Description">
  <input [(ngModel)]="transaction.amount" type="number">
  <select [(ngModel)]="transaction.categoryId" (change)="onCategoryChange()">
    <option *ngFor="let cat of categories" [value]="cat.id">
      {{ cat.icon }} {{ cat.name }}
    </option>
  </select>
  
  <!-- Sélection de la ligne budgétaire -->
  <div class="budget-line-selector" *ngIf="availableLines.length > 0">
    <label>Rattacher à une ligne budgétaire (optionnel)</label>
    <select [(ngModel)]="transaction.budgetLineId">
      <option [value]="null">Aucune ligne</option>
      <option *ngFor="let line of availableLines" [value]="line.id">
        {{ line.label }} - 
        {{ line.actualAmount | currency }}€ / {{ line.plannedAmount | currency }}€
        ({{ line.percentageUsed | number:'1.0-0' }}%)
      </option>
    </select>
  </div>
  
  <!-- Alerte si dépassement -->
  <div class="alert alert-danger" *ngIf="currentAlert">
    {{ currentAlert.message }}
    <ul>
      <li *ngFor="let suggestion of currentAlert.suggestions">
        {{ suggestion }}
      </li>
    </ul>
  </div>
  
  <button (click)="save()">Enregistrer</button>
</div>
```

### Dashboard avec prévisions

```html
<div class="budget-dashboard">
  <h2>Budget {{ currentMonth }} {{ currentYear }}</h2>
  
  <!-- Progression globale -->
  <div class="overall-progress">
    <div class="progress-bar">
      <div class="fill" [style.width.%]="budget.percentageUsed"></div>
    </div>
    <p>{{ budget.totalActual | currency }}€ / {{ budget.totalPlanned | currency }}€</p>
  </div>
  
  <!-- Prévisions -->
  <div class="forecast" *ngIf="forecast">
    <h3>🔮 Prévisions de fin de mois</h3>
    <p>
      Projection: {{ forecast.overall.projectedEnd | currency }}€
      <span [class.danger]="forecast.overall.projectedVariance > 0">
        ({{ forecast.overall.projectedVariance > 0 ? '+' : '' }}{{ forecast.overall.projectedVariance | currency }}€)
      </span>
    </p>
    <p>Confiance: {{ forecast.overall.confidence }}%</p>
    
    <div class="recommendations">
      <h4>💡 Recommandations</h4>
      <ul>
        <li *ngFor="let rec of forecast.recommendations">{{ rec }}</li>
      </ul>
    </div>
  </div>
  
  <!-- Catégories -->
  <div *ngFor="let category of budget.categories" class="category-section">
    <app-budget-line-manager
      [budgetId]="budget.id"
      [categoryId]="category.categoryId"
      [categoryName]="category.categoryName"
      [categoryIcon]="category.categoryIcon"
      (linesChanged)="refreshBudget()">
    </app-budget-line-manager>
  </div>
</div>
```

---

## 🔐 Bonnes pratiques

### 1. Gestion des erreurs

```typescript
createBudgetLine() {
  this.budgetLineService.createBudgetLine(familyId, budgetId, categoryId, request)
    .subscribe({
      next: (created) => {
        this.showSuccess('Ligne budgétaire créée');
        this.refreshLines();
      },
      error: (err) => {
        if (err.status === 400) {
          this.showError('Données invalides: ' + err.error.message);
        } else if (err.status === 409) {
          this.showError('Vous avez atteint le nombre maximum de lignes (10)');
        } else {
          this.showError('Erreur serveur');
        }
      }
    });
}
```

### 2. Optimisation des performances

```typescript
// Utiliser les observables pour éviter les appels multiples
ngOnInit() {
  // S'abonner une seule fois au budget actif
  this.budgetInstanceService.activeBudget$
    .pipe(
      filter(budget => budget !== null),
      switchMap(budget => {
        // Charger les lignes une fois le budget disponible
        return this.budgetLineService.getBudgetLinesByCategory(
          this.familyId,
          budget.id,
          this.categoryId
        );
      })
    )
    .subscribe(lines => {
      this.lines = lines;
    });
}
```

### 3. Validation côté frontend

```typescript
validateLine(line: BudgetLineRequest): string[] {
  const errors: string[] = [];
  
  if (!line.label || line.label.trim() === '') {
    errors.push('Le nom est requis');
  }
  
  if (line.plannedAmount <= 0) {
    errors.push('Le montant doit être positif');
  }
  
  if (line.plannedAmount > 100000) {
    errors.push('Le montant semble trop élevé');
  }
  
  return errors;
}
```

---

## 📊 Métriques et monitoring

```typescript
// Logger les événements importants
logBudgetEvent(event: string, data: any) {
  console.log(`[BUDGET] ${event}`, {
    timestamp: new Date(),
    familyId: this.familyId,
    budgetId: this.budgetId,
    ...data
  });
}

// Exemples
this.logBudgetEvent('LINE_CREATED', { lineId, amount });
this.logBudgetEvent('ALERT_TRIGGERED', { severity, message });
this.logBudgetEvent('FORECAST_CALCULATED', { projection, variance });
```

---

## ✅ Checklist d'intégration

### Backend
- [ ] Créer les entités JPA
- [ ] Créer les repositories
- [ ] Implémenter les services de recalcul
- [ ] Créer les contrôleurs REST
- [ ] Ajouter les tests
- [ ] Documenter l'API

### Frontend
- [x] Créer les modèles TypeScript
- [x] Créer les services Angular
- [x] Créer le composant Budget Line Manager
- [ ] Modifier le composant Transaction pour le rattachement
- [ ] Créer le composant de prévisions
- [ ] Créer le composant d'alertes
- [ ] Intégrer dans le dashboard

### Tests
- [ ] Tester la création de template
- [ ] Tester la génération de budget
- [ ] Tester le rattachement de transactions
- [ ] Tester le recalcul automatique
- [ ] Tester les alertes
- [ ] Tester les prévisions

---

Cette documentation complète devrait vous permettre d'intégrer le système de lignes budgétaires dans votre application. Bonne implémentation ! 🚀
