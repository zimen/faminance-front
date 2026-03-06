# Prompt Backend Onboarding - Guide d'utilisation rapide

## 📋 Checklist d'implémentation

Utilisez cette checklist pour suivre votre progression lors de l'adaptation du backend :

### Phase 1: Modèle de données (30 min)
- [ ] Ajouter les champs à l'entité `User` (onboarding_completed, onboarding_completed_at, first_name)
- [ ] Créer la migration SQL pour ajouter ces colonnes
- [ ] Exécuter la migration sur votre base de données locale
- [ ] Vérifier que les colonnes sont bien créées

### Phase 2: DTOs (45 min)
- [ ] Créer `OnboardingStatusResponse` et son sous-DTO `StepsCompleted`
- [ ] Créer `FamilyQuickSetupRequest` et `FamilyQuickSetupResponse`
- [ ] Créer `BulkCategoriesRequest`
- [ ] Vérifier les validations (@NotBlank, @NotEmpty, etc.)

### Phase 3: Repositories (15 min)
- [ ] Ajouter `countByUserId()` à `FamilyMemberRepository`
- [ ] Ajouter `countByUserFamilies()` à `CategoryRepository`
- [ ] Ajouter `countByUserFamilies()` à `TransactionRepository`
- [ ] Tester les queries avec des données de test

### Phase 4: Service OnboardingService (1h)
- [ ] Créer `OnboardingService` avec toutes les méthodes
- [ ] Implémenter `getOnboardingStatus()` avec la logique de calcul
- [ ] Implémenter `markOnboardingAsCompleted()` avec mise à jour automatique
- [ ] Ajouter les logs appropriés
- [ ] Écrire les tests unitaires

### Phase 5: Service FamilyService (45 min)
- [ ] Ajouter la méthode `quickSetup()`
- [ ] Gérer la validation (pas de famille multiple lors du quick-setup)
- [ ] Utiliser `@Transactional` pour la cohérence des données
- [ ] Tester avec Postman/curl

### Phase 6: Service CategoryService (30 min)
- [ ] Ajouter la méthode `addMultipleSystemCategories()`
- [ ] Gérer les doublons (éviter d'ajouter 2 fois la même catégorie système)
- [ ] Vérifier que les systemCategoryIds existent
- [ ] Tester l'ajout en bulk

### Phase 7: Controllers (30 min)
- [ ] Créer `OnboardingController` avec GET /users/me/onboarding-status
- [ ] Ajouter POST /families/quick-setup à `FamilyController`
- [ ] Ajouter POST /families/{familyId}/categories/bulk à `CategoryController`
- [ ] Ajouter les annotations Swagger (@Operation, @Tag)

### Phase 8: Sécurité et validations (30 min)
- [ ] Vérifier que tous les endpoints sont protégés (JWT requis)
- [ ] Ajouter les vérifications de rôles (PARENT minimum pour categories/bulk)
- [ ] Tester les cas d'erreur (401, 403, 404, 400)
- [ ] Ajouter la gestion globale des exceptions si nécessaire

### Phase 9: Tests (1h30)
- [ ] Tests unitaires `OnboardingServiceTest` (tous les scénarios)
- [ ] Tests d'intégration `OnboardingControllerTest`
- [ ] Tests d'intégration `FamilyControllerTest` (quick-setup)
- [ ] Tests d'intégration `CategoryControllerTest` (bulk)
- [ ] Vérifier la couverture de code (>80%)

### Phase 10: Documentation et déploiement (30 min)
- [ ] Générer la doc Swagger/OpenAPI
- [ ] Tester tous les endpoints avec Swagger UI
- [ ] Créer des données de test pour les catégories système recommandées
- [ ] Mettre à jour le README du projet
- [ ] Déployer en environnement de dev/staging

**Temps estimé total**: 6-7 heures

---

## 🎯 Utilisation du prompt

### Option 1: Copier-coller le prompt complet
1. Ouvrez [BACKEND_ONBOARDING_PROMPT.md](./BACKEND_ONBOARDING_PROMPT.md)
2. Copiez tout le contenu
3. Collez dans votre assistant IA préféré (ChatGPT, Claude, etc.)
4. Ajoutez éventuellement des informations spécifiques à votre projet

### Option 2: Utilisation par sections
Si vous préférez travailler par étapes :
1. **D'abord**: Lisez la section "Workflow d'onboarding frontend" pour comprendre le contexte
2. **Puis**: Utilisez les exemples de code dans [BACKEND_ONBOARDING_CODE_EXAMPLES.md](./BACKEND_ONBOARDING_CODE_EXAMPLES.md)
3. **Enfin**: Adaptez selon votre architecture existante

---

## 📊 Architecture de l'implémentation

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Angular                     │
│  Step1 → Step2 → Step3 → Step4 → Complete → Dashboard      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend Spring Boot                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              OnboardingController                     │  │
│  │  GET /users/me/onboarding-status                     │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              OnboardingService                        │  │
│  │  - getOnboardingStatus()                             │  │
│  │  - markOnboardingAsCompleted()                       │  │
│  │  - calculateCurrentStep()                            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│         ┌─────────────┼─────────────┐                      │
│         │             │             │                      │
│  ┌──────▼─────┐ ┌────▼────┐ ┌─────▼──────┐               │
│  │ Family     │ │Category │ │Transaction │               │
│  │ Service    │ │Service  │ │Service     │               │
│  │            │ │         │ │            │               │
│  │quickSetup()│ │bulk()   │ │create()    │               │
│  └──────┬─────┘ └────┬────┘ └─────┬──────┘               │
│         │            │            │                        │
│  ┌──────▼────────────▼────────────▼──────┐                │
│  │          Repositories (JPA)            │                │
│  │  - FamilyRepository                    │                │
│  │  - FamilyMemberRepository              │                │
│  │  - CategoryRepository                  │                │
│  │  - TransactionRepository               │                │
│  │  - UserRepository                      │                │
│  └──────────────────┬─────────────────────┘                │
│                     │                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │   Database     │
              └────────────────┘
```

---

## 🔄 Flow complet d'un onboarding

```
1. User s'inscrit (Step 1)
   POST /api/auth/register
   ├─> Créer User { email, password }
   ├─> Générer JWT
   └─> Retourner { accessToken, refreshToken, user }

2. User crée sa famille (Step 2)
   POST /api/families/quick-setup
   ├─> Vérifier que user n'a pas déjà de famille
   ├─> Mettre à jour User.firstName
   ├─> Créer Family { name }
   ├─> Créer FamilyMember { user, family, role: ADMIN }
   └─> Retourner { family, member }

3. User ajoute des catégories (Step 3)
   POST /api/families/{familyId}/categories/bulk
   ├─> Vérifier les droits (PARENT minimum)
   ├─> Pour chaque systemCategoryId:
   │   ├─> Vérifier qu'elle n'existe pas déjà
   │   ├─> Copier SystemCategory → Category
   │   └─> Sauvegarder
   └─> Retourner List<Category>

4. User ajoute sa première transaction (Step 4 - optionnel)
   POST /api/families/{familyId}/transactions
   ├─> Créer Transaction { description, amount, category, date }
   └─> Retourner Transaction

5. À CHAQUE étape, vérifier l'onboarding
   GET /api/users/me/onboarding-status
   ├─> Calculer accountCreated (toujours true si auth)
   ├─> Calculer familyCreated (COUNT family_members)
   ├─> Calculer categoriesAdded (COUNT categories)
   ├─> Calculer firstTransactionAdded (COUNT transactions)
   ├─> Si toutes les étapes obligatoires = true:
   │   ├─> User.onboardingCompleted = true
   │   └─> User.onboardingCompletedAt = NOW()
   └─> Retourner { completed, currentStep, stepsCompleted }
```

---

## 🧪 Scénarios de test prioritaires

### Test 1: Nouveau utilisateur complet
```
1. POST /auth/register → 201 Created
2. GET /users/me/onboarding-status → { completed: false, currentStep: 2 }
3. POST /families/quick-setup → 201 Created
4. GET /users/me/onboarding-status → { completed: false, currentStep: 3 }
5. POST /families/{id}/categories/bulk → 201 Created
6. GET /users/me/onboarding-status → { completed: true, completedAt: "..." }
```

### Test 2: Utilisateur existant qui se reconnecte
```
1. POST /auth/login → 200 OK
2. GET /users/me/onboarding-status → { completed: true, ... }
```

### Test 3: Quick-setup appelé 2 fois (doit échouer)
```
1. POST /families/quick-setup → 201 Created
2. POST /families/quick-setup → 400 Bad Request
```

### Test 4: Bulk categories avec doublons
```
1. POST /categories/bulk { ids: [1, 2, 3] } → 201 Created (3 catégories)
2. POST /categories/bulk { ids: [2, 3, 4] } → 201 Created (1 catégorie: 4)
```

---

## 🚀 Démarrage rapide (Quick Start)

Si vous voulez aller **très vite**, voici le strict minimum :

### 1. Migration SQL (2 min)
```sql
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
```

### 2. Endpoint de statut (10 min)
Copiez le code de `OnboardingService.getOnboardingStatus()` et `OnboardingController` depuis [BACKEND_ONBOARDING_CODE_EXAMPLES.md](./BACKEND_ONBOARDING_CODE_EXAMPLES.md)

### 3. Endpoint quick-setup (15 min)
Copiez le code de `FamilyService.quickSetup()` depuis les exemples

### 4. Endpoint bulk categories (10 min)
Copiez le code de `CategoryService.addMultipleSystemCategories()` depuis les exemples

### 5. Tester avec curl (5 min)
```bash
# Récupérer le statut
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/users/me/onboarding-status

# Quick setup
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"familyName":"Ma Famille","userFirstName":"Jean"}' \
  http://localhost:8080/api/families/quick-setup

# Bulk categories
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"systemCategoryIds":[1,2,3]}' \
  http://localhost:8080/api/families/1/categories/bulk
```

**Total: ~45 minutes pour un MVP fonctionnel**

---

## 📞 Support et questions

Si vous avez des questions ou rencontrez des problèmes :

1. **Vérifiez d'abord** :
   - Les migrations SQL sont bien appliquées
   - Les repositories ont les bonnes méthodes custom
   - Les permissions JWT sont configurées
   - Les données de test existent (catégories système)

2. **Problèmes courants** :
   - *401 Unauthorized* → Vérifier le JWT dans le header Authorization
   - *403 Forbidden* → Vérifier les rôles (PARENT requis pour categories)
   - *404 Not Found* → Vérifier que familyId et systemCategoryIds existent
   - *N+1 queries* → Ajouter @EntityGraph ou fetch joins

3. **Optimisations futures** :
   - Mettre en cache le statut d'onboarding (Redis)
   - Ajouter des événements Spring pour tracker les étapes
   - Créer un dashboard admin pour voir les statistiques d'onboarding
   - Ajouter des notifications email/push pour rappeler de terminer

---

## 📚 Ressources supplémentaires

- [BACKEND_ONBOARDING_PROMPT.md](./BACKEND_ONBOARDING_PROMPT.md) - Prompt complet avec tous les détails
- [BACKEND_ONBOARDING_CODE_EXAMPLES.md](./BACKEND_ONBOARDING_CODE_EXAMPLES.md) - Exemples de code Java complets
- [ONBOARDING_RESUME.md](./ONBOARDING_RESUME.md) - Documentation frontend de la reprise d'onboarding
- [ONBOARDING_EXAMPLES.ts](./ONBOARDING_EXAMPLES.ts) - Exemples d'utilisation côté frontend

Bonne implémentation ! 🚀
