# Plan de Migration : Budgets avec Lignes Détaillées

## Date : 7 mars 2026

## 🔍 Situation actuelle

### Deux systèmes parallèles existent :

#### 1. **Budget** (ancien système - actuellement utilisé)
```typescript
interface Budget {
  categoryId: number;
  amount: number;           // UN SEUL montant par catégorie
  month: number;
  year: number;
  spent: number;
}
```
- ✅ Utilisé par `BudgetComponent`
- ✅ Service : `BudgetService`
- ❌ **Problème** : Pas de lignes détaillées
- ❌ Perte d'information lors de l'application d'un template

#### 2. **BudgetInstance** (système avancé - déjà implémenté !)
```typescript
interface BudgetInstance {
  id: number;
  month: number;
  year: number;
  categories: BudgetCategoryInstance[];  // ⭐ Plusieurs catégories
}

interface BudgetCategoryInstance {
  categoryId: number;
  lines: BudgetLine[];                   // ⭐ LIGNES DÉTAILLÉES
  totalPlanned: number;
  totalActual: number;
}

interface BudgetLine {
  label: string;
  plannedAmount: number;
  actualAmount: number;
  transactions: [];
  status: BudgetLineStatus;
}
```
- ✅ Structure complète avec lignes
- ✅ Service : `BudgetInstanceService` EXISTE DÉJÀ
- ✅ Méthode `generateFromTemplate()` EXISTE DÉJÀ
- ❌ **Problème** : Pas utilisé par le composant UI

## 🎯 Objectif

Migrer le `BudgetComponent` pour utiliser `BudgetInstance` au lieu de `Budget`, afin de bénéficier des lignes détaillées.

## 📋 Plan de Migration

### Phase 1 : Préparer le composant Budget ✅ (À FAIRE)

**Fichier** : `budget.component.ts`

**Changements** :
```typescript
// AVANT
import { Budget } from '../../core/models/budget.model';
import { BudgetService } from '../../core/services/budget.service';

budgets: Budget[] = [];

loadBudgets() {
  this.budgetService.getBudgetsByMonthAndYear(...)
}

// APRÈS
import { BudgetInstance } from '../../core/models/budget-template.model';
import { BudgetInstanceService } from '../../core/services/budget-instance.service';

budgetInstance: BudgetInstance | null = null;

loadBudget() {
  this.budgetInstanceService.getByMonthAndYear(...)
}
```

### Phase 2 : Adapter le template HTML

**Fichier** : `budget.component.html`

**Structure actuelle** :
```html
<div *ngFor="let budget of budgets">
  {{ budget.categoryName }}: {{ budget.amount }}€
</div>
```

**Nouvelle structure** :
```html
<div *ngFor="let category of budgetInstance?.categories">
  <h3>{{ category.categoryName }} ({{ category.totalPlanned }}€)</h3>
  
  <!-- LIGNES DÉTAILLÉES -->
  <div *ngFor="let line of category.lines">
    {{ line.label }}: {{ line.plannedAmount }}€ 
    (Dépensé: {{ line.actualAmount }}€)
  </div>
</div>
```

### Phase 3 : Application de template

**Actuellement** (budget-template.component.ts) :
```typescript
applyTemplate() {
  this.budgetTemplateService.applyTemplate(...).subscribe(
    (budgets: Budget[]) => {  // Retourne l'ancien format !
      // ...
    }
  );
}
```

**Solution** : Utiliser `BudgetInstanceService.generateFromTemplate()` :
```typescript
applyTemplate() {
  this.budgetInstanceService.generateFromTemplate(
    this.selectedFamilyId,
    this.applyTemplateId,
    this.applyMonth,
    this.applyYear
  ).subscribe((budgetInstance: BudgetInstance) => {
    // budgetInstance contient déjà les lignes détaillées !
    this.successMessage = 'Budget créé avec lignes détaillées';
  });
}
```

## 🔄 Flux complet

### Scénario : Application d'un template

1. **Template créé** avec 5 lignes :
   ```json
   {
     "lines": [
       { "categoryId": 1, "label": "Loyer", "plannedAmount": 1200 },
       { "categoryId": 1, "label": "Charges", "plannedAmount": 150 },
       { "categoryId": 2, "label": "Courses", "plannedAmount": 400 },
       { "categoryId": 3, "label": "Essence", "plannedAmount": 200 },
       { "categoryId": 3, "label": "Métro", "plannedAmount": 70 }
     ]
   }
   ```

2. **Utilisateur applique** le template pour Mars 2026

3. **Backend crée un BudgetInstance** :
   ```json
   {
     "id": 123,
     "month": 3,
     "year": 2026,
     "categories": [
       {
         "categoryId": 1,
         "categoryName": "Logement",
         "lines": [
           { "id": 1, "label": "Loyer", "plannedAmount": 1200, "actualAmount": 0 },
           { "id": 2, "label": "Charges", "plannedAmount": 150, "actualAmount": 0 }
         ],
         "totalPlanned": 1350
       },
       {
         "categoryId": 2,
         "categoryName": "Alimentation",
         "lines": [
           { "id": 3, "label": "Courses", "plannedAmount": 400, "actualAmount": 0 }
         ],
         "totalPlanned": 400
       },
       {
         "categoryId": 3,
         "categoryName": "Transport",
         "lines": [
           { "id": 4, "label": "Essence", "plannedAmount": 200, "actualAmount": 0 },
           { "id": 5, "label": "Métro", "plannedAmount": 70, "actualAmount": 0 }
         ],
         "totalPlanned": 270
       }
     ]
   }
   ```

4. **Frontend affiche** les lignes détaillées groupées par catégorie

5. **Utilisateur crée une transaction** "Courses Carrefour 45€"

6. **Transaction liée** à `BudgetLine id=3` → `actualAmount` passe à 45€

7. **Affichage mis à jour** :
   - Courses : 400€ planifié, 45€ dépensé, 355€ restant (11% utilisé)

## 📊 Avantages après migration

✅ **Suivi détaillé** : Voir chaque ligne (Loyer, Charges, etc.) séparément  
✅ **Cohérence** : Templates → Budgets → Transactions (même structure)  
✅ **Récurrence** : Conservation des infos de récurrence des lignes  
✅ **Alertes** : Alertes par ligne spécifique possible  
✅ **Flexibilité** : Ajout manuel de lignes après création  
✅ **Historique** : Suivi d'évolution par ligne sur plusieurs mois  

## ⚠️ Points d'attention

### Backend
- ✅ `BudgetInstanceService` existe déjà
- ✅ `generateFromTemplate()` existe déjà
- ❓ Vérifie que le backend **crée bien les BudgetLines** depuis les lignes du template

### Migration des données
- Les anciens `Budget` simples existent encore en base
- Options :
  1. **Cohabitation** : Garder les deux systèmes (recommandé temporairement)
  2. **Migration** : Script pour convertir Budget → BudgetInstance
  3. **Dépréciation** : Marquer l'ancien système comme obsolète

### Compatibilité
- Garder `BudgetService` pour compatibilité ascendante
- Ajouter un flag "legacy mode" si besoin
- Migration progressive des utilisateurs

## 🚀 Prochaines étapes

1. ✅ **Analyser** la structure actuelle (FAIT)
2. ⏳ **Modifier** budget.component.ts pour utiliser BudgetInstance
3. ⏳ **Adapter** budget.component.html pour afficher les lignes
4. ⏳ **Modifier** budget-template.component.ts pour utiliser generateFromTemplate()
5. ⏳ **Tester** la création et l'affichage
6. ⏳ **Vérifier** le lien transactions → lignes
7. ⏳ **Documenter** pour le backend

## 💬 Questions ?

- Veux-tu qu'on commence la migration du BudgetComponent ?
- Préfères-tu une migration complète ou progressive ?
- As-tu besoin d'une période de cohabitation des deux systèmes ?
