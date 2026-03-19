# Mise à jour API Backend - Templates de Budget (Simplification)

## Date : 7 mars 2026

## Contexte
Simplification de la structure des requêtes pour les templates de budget. Au lieu d'une structure hiérarchique `items → lines`, nous envoyons maintenant directement un tableau de lignes avec leur `categoryId`.

## 🔴 ANCIEN FORMAT (Legacy)

### Requête de création/modification
```json
{
  "name": "Budget Mensuel",
  "description": "Mon budget standard",
  "isDefault": true,
  "items": [
    {
      "categoryId": 1,
      "displayOrder": 0,
      "lines": [
        {
          "label": "Loyer",
          "plannedAmount": 1200.00,
          "recurrence": "MONTHLY",
          "displayOrder": 0
        }
      ]
    },
    {
      "categoryId": 2,
      "displayOrder": 1,
      "lines": [
        {
          "label": "Courses",
          "plannedAmount": 400.00,
          "displayOrder": 0
        }
      ]
    }
  ]
}
```

## 🟢 NOUVEAU FORMAT (Simplifié)

### Requête de création/modification
```json
{
  "name": "Budget Mensuel",
  "description": "Mon budget standard",
  "isDefault": true,
  "lines": [
    {
      "categoryId": 1,
      "label": "Loyer",
      "plannedAmount": 1200.00,
      "recurrence": "MONTHLY",
      "displayOrder": 0
    },
    {
      "categoryId": 2,
      "label": "Courses",
      "plannedAmount": 400.00,
      "recurrence": "NONE",
      "displayOrder": 1
    },
    {
      "categoryId": 1,
      "label": "Charges copropriété",
      "plannedAmount": 150.00,
      "recurrence": "MONTHLY",
      "displayOrder": 2
    }
  ]
}
```

## Avantages de la nouvelle structure

✅ **Plus simple** : Pas besoin de regrouper/dégrouper les lignes  
✅ **Plus logique** : Chaque ligne a son `categoryId`, le regroupement est fait côté UI uniquement  
✅ **Moins de code** : Suppression de la logique de transformation côté frontend  
✅ **Plus flexible** : Facilite l'ajout de lignes dans différentes catégories  
✅ **Cohérent** : Correspond à la structure réelle des données  

## Structure TypeScript Frontend

```typescript
export interface BudgetTemplateRequest {
  name: string;
  description?: string;
  isDefault: boolean;
  lines: BudgetTemplateLineRequest[];
}

export interface BudgetTemplateLineRequest {
  categoryId: number;        // 🔥 Maintenant directement dans la ligne
  label: string;
  description?: string;
  plannedAmount: number;
  recurrence?: RecurrencePattern;
  dayOfMonth?: number;
  dayOfWeek?: number;
  autoCreateTransaction?: boolean;
  autoTransactionDescription?: string;
  notes?: string;
  displayOrder?: number;
}
```

## Compatibilité Backend

Le backend doit accepter les deux formats temporairement :

1. **Nouveau format** (recommandé) : `lines` directement avec `categoryId`
2. **Ancien format** (legacy) : `items[]` avec `lines[]` imbriquées

### Exemple de logique backend (pseudo-code)

```java
// Dans le controller/service
public BudgetTemplate createOrUpdateTemplate(BudgetTemplateRequest request) {
    List<BudgetTemplateLine> allLines = new ArrayList<>();
    
    // Nouveau format (préféré)
    if (request.getLines() != null && !request.getLines().isEmpty()) {
        allLines = request.getLines();
    } 
    // Ancien format (compatibilité)
    else if (request.getItems() != null) {
        for (BudgetTemplateItem item : request.getItems()) {
            for (BudgetTemplateLineRequest line : item.getLines()) {
                line.setCategoryId(item.getCategoryId());
                allLines.add(line);
            }
        }
    }
    
    // Sauvegarder les lignes...
}
```

## Réponse Backend (GET)

Le backend peut continuer à renvoyer le format hiérarchique `items[]` avec `lines[]` pour compatibilité. Le frontend gère déjà la conversion lors du chargement.

### Exemple de réponse
```json
{
  "id": 123,
  "name": "Budget Mensuel",
  "description": "Mon budget standard",
  "isDefault": true,
  "totalPlannedAmount": 1750.00,
  "items": [
    {
      "categoryId": 1,
      "categoryName": "Logement",
      "categoryIcon": "🏠",
      "totalPlannedAmount": 1350.00,
      "lines": [
        {
          "id": 1,
          "label": "Loyer",
          "plannedAmount": 1200.00,
          "recurrence": "MONTHLY"
        },
        {
          "id": 2,
          "label": "Charges copropriété",
          "plannedAmount": 150.00,
          "recurrence": "MONTHLY"
        }
      ]
    },
    {
      "categoryId": 2,
      "categoryName": "Alimentation",
      "categoryIcon": "🛒",
      "totalPlannedAmount": 400.00,
      "lines": [
        {
          "id": 3,
          "label": "Courses",
          "plannedAmount": 400.00
        }
      ]
    }
  ]
}
```

## Migration

### Phase 1 : Backend accepte les deux formats ✅
- Modifier le DTO pour accepter `lines[]` ou `items[]`
- Logique de conversion interne

### Phase 2 : Frontend envoie le nouveau format ✅ (FAIT)
- Modification de `BudgetTemplateRequest`
- Simplification de `saveTemplate()`

### Phase 3 : Backend répond avec le nouveau format (optionnel)
- Simplifier la réponse pour envoyer `lines[]` directement
- Adapter `loadTemplate()` côté frontend

## Fichiers modifiés (Frontend)

- ✅ `src/app/core/models/budget-template.model.ts`
  - Ajout `categoryId` dans `BudgetTemplateLineRequest`
  - Modification `BudgetTemplateRequest` pour accepter `lines[]`
  - Création `BudgetTemplateRequestLegacy` pour compatibilité

- ✅ `src/app/components/budget-template-form/budget-template-form.component.ts`
  - Simplification `saveTemplate()` : envoi direct des lignes
  - Suppression de la logique de regroupement par catégorie
  - Conservation de `loadTemplate()` pour compatibilité

## Points d'attention Backend

🔴 **Validation** : Chaque ligne doit avoir un `categoryId` valide  
🔴 **Ordre** : Respecter `displayOrder` pour l'ordre global des lignes  
🔴 **Limites** : Maximum 10 lignes par catégorie (validation frontend + backend)  
🔴 **Calcul totaux** : Grouper les lignes par catégorie pour calculer `totalPlannedAmount` par item  

## Questions ?

Contactez l'équipe frontend pour clarifications sur la nouvelle structure.
