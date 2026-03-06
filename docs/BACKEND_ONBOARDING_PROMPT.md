# Prompt pour adapter le backend Java au workflow d'onboarding

## Context
Je développe une application de gestion financière familiale avec un frontend Angular et un backend Spring Boot. J'ai implémenté un workflow d'onboarding complet dans le frontend qui guide les nouveaux utilisateurs à travers 4 étapes obligatoires. J'ai besoin d'adapter le backend pour supporter ce processus avec synchronisation de l'état d'onboarding.

## Architecture actuelle du backend
- **Framework**: Spring Boot 3.x
- **Base de données**: PostgreSQL
- **Sécurité**: JWT (accessToken + refreshToken)
- **Entités principales**: User, Family, FamilyMember, Category, Transaction, Budget

## Workflow d'onboarding frontend (4 étapes)

### Étape 1: Inscription simplifiée
- **Route**: `/onboarding/register`
- **Champs**: email, password, acceptTerms (CGU)
- **Endpoint attendu**: `POST /api/auth/register` avec `{ email, password }`
- **Action**: Créer un compte utilisateur basique, générer JWT, marquer `onboardingStatus.accountCreated = true`

### Étape 2: Création famille + profil utilisateur
- **Route**: `/onboarding/family-setup`
- **Champs**: firstName (prénom utilisateur), familyName (nom de la famille), nickname (optionnel)
- **Endpoint attendu**: `POST /api/families/quick-setup`
- **Payload**:
```json
{
  "familyName": "Famille Dupont",
  "userFirstName": "Jean",
  "userNickname": "Jiji"
}
```
- **Réponse attendue**:
```json
{
  "family": { /* objet Family complet */ },
  "member": { /* objet FamilyMember avec role ADMIN */ }
}
```
- **Actions**:
  1. Créer une nouvelle famille
  2. Mettre à jour le profil utilisateur (firstName)
  3. Créer un FamilyMember liant l'utilisateur à la famille avec le rôle ADMIN
  4. Marquer `onboardingStatus.familyCreated = true`

### Étape 3: Ajout de catégories recommandées
- **Route**: `/onboarding/categories`
- **Champs**: Liste de categoryIds (catégories système sélectionnées)
- **Endpoint attendu**: `POST /api/families/{familyId}/categories/bulk`
- **Payload**:
```json
{
  "systemCategoryIds": [1, 2, 3, 4, 5, 6]
}
```
- **Réponse**: Liste des catégories créées
- **Actions**:
  1. Pour chaque systemCategoryId, créer une copie de la catégorie système pour la famille
  2. Marquer `onboardingStatus.categoriesAdded = true`

### Étape 4: Première transaction (optionnelle)
- **Route**: `/onboarding/first-transaction`
- **Champs**: description, amount, categoryId, date, type
- **Endpoint attendu**: `POST /api/families/{familyId}/transactions`
- **Payload**:
```json
{
  "description": "Courses du mardi",
  "amount": 45.50,
  "categoryId": 2,
  "type": "EXPENSE",
  "date": "2026-03-04",
  "notes": ""
}
```
- **Actions**:
  1. Créer une transaction
  2. Marquer `onboardingStatus.firstTransactionAdded = true`
  3. Si toutes les étapes obligatoires sont complétées, marquer `onboardingStatus.completed = true` et `onboardingStatus.completedAt = NOW()`

## Nouveau endpoint de synchronisation d'état

### GET /api/users/me/onboarding-status

**Authentification**: Requise (JWT Bearer token)

**Réponse**:
```json
{
  "completed": false,
  "currentStep": 2,
  "stepsCompleted": {
    "accountCreated": true,
    "familyCreated": false,
    "categoriesAdded": false,
    "firstTransactionAdded": false
  },
  "completedAt": null
}
```

**Logique de calcul**:
- `accountCreated`: L'utilisateur existe (toujours true si authentifié)
- `familyCreated`: L'utilisateur a créé ou rejoint au moins une famille
- `categoriesAdded`: Au moins une catégorie existe pour la famille de l'utilisateur
- `firstTransactionAdded`: Au moins une transaction existe pour la famille
- `currentStep`: Calculé en fonction des étapes complétées (1-4)
- `completed`: true si toutes les étapes obligatoires sont complétées
- `completedAt`: Date ISO 8601 de la première fois où `completed` devient true

## Modifications nécessaires

### 1. Entité User
Ajouter les champs pour tracker l'onboarding:
```java
@Entity
@Table(name = "users")
public class User {
    // ... champs existants ...
    
    @Column(name = "onboarding_completed")
    private Boolean onboardingCompleted = false;
    
    @Column(name = "onboarding_completed_at")
    private LocalDateTime onboardingCompletedAt;
    
    @Column(name = "first_name")
    private String firstName;
}
```

### 2. Nouveau DTO: OnboardingStatusResponse
```java
public class OnboardingStatusResponse {
    private Boolean completed;
    private Integer currentStep;
    private StepsCompleted stepsCompleted;
    private LocalDateTime completedAt;
    
    @Data
    public static class StepsCompleted {
        private Boolean accountCreated;
        private Boolean familyCreated;
        private Boolean categoriesAdded;
        private Boolean firstTransactionAdded;
    }
}
```

### 3. Nouveau DTO: FamilyQuickSetupRequest
```java
@Data
public class FamilyQuickSetupRequest {
    @NotBlank(message = "Le nom de la famille est requis")
    private String familyName;
    
    @NotBlank(message = "Le prénom de l'utilisateur est requis")
    private String userFirstName;
    
    private String userNickname;
}
```

### 4. Nouveau DTO: FamilyQuickSetupResponse
```java
@Data
public class FamilyQuickSetupResponse {
    private FamilyResponse family;
    private FamilyMemberResponse member;
}
```

### 5. Nouveau DTO: BulkCategoriesRequest
```java
@Data
public class BulkCategoriesRequest {
    @NotEmpty(message = "Au moins une catégorie doit être sélectionnée")
    private List<Long> systemCategoryIds;
}
```

### 6. Service OnboardingService
Créer un nouveau service dédié à la logique d'onboarding:

```java
@Service
@RequiredArgsConstructor
public class OnboardingService {
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    
    public OnboardingStatusResponse getOnboardingStatus(User currentUser) {
        // Calculer l'état d'avancement
        boolean accountCreated = true; // Si on est ici, le compte existe
        boolean familyCreated = hasFamily(currentUser);
        boolean categoriesAdded = hasCategories(currentUser);
        boolean firstTransactionAdded = hasTransaction(currentUser);
        
        // Calculer currentStep
        int currentStep = 1;
        if (accountCreated) currentStep = 2;
        if (familyCreated) currentStep = 3;
        if (categoriesAdded) currentStep = 4;
        if (firstTransactionAdded) currentStep = 5; // Terminé
        
        // Vérifier si tout est complété
        boolean completed = accountCreated && familyCreated 
                         && categoriesAdded; // firstTransaction est optionnelle
        
        // Si vient d'être complété et pas encore marqué, le marquer
        if (completed && !currentUser.getOnboardingCompleted()) {
            currentUser.setOnboardingCompleted(true);
            currentUser.setOnboardingCompletedAt(LocalDateTime.now());
            userRepository.save(currentUser);
        }
        
        return OnboardingStatusResponse.builder()
            .completed(completed)
            .currentStep(currentStep)
            .stepsCompleted(new StepsCompleted(
                accountCreated,
                familyCreated,
                categoriesAdded,
                firstTransactionAdded
            ))
            .completedAt(currentUser.getOnboardingCompletedAt())
            .build();
    }
    
    private boolean hasFamily(User user) {
        return !user.getFamilyMemberships().isEmpty();
    }
    
    private boolean hasCategories(User user) {
        // Vérifier si au moins une famille de l'utilisateur a des catégories
        return user.getFamilyMemberships().stream()
            .anyMatch(membership -> !membership.getFamily().getCategories().isEmpty());
    }
    
    private boolean hasTransaction(User user) {
        // Vérifier si au moins une famille de l'utilisateur a des transactions
        return user.getFamilyMemberships().stream()
            .anyMatch(membership -> !membership.getFamily().getTransactions().isEmpty());
    }
}
```

### 7. Controller OnboardingController
```java
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class OnboardingController {
    private final OnboardingService onboardingService;
    
    @GetMapping("/onboarding-status")
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(onboardingService.getOnboardingStatus(currentUser));
    }
}
```

### 8. Modifications FamilyController
Ajouter l'endpoint quick-setup:

```java
@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {
    // ... méthodes existantes ...
    
    @PostMapping("/quick-setup")
    public ResponseEntity<FamilyQuickSetupResponse> quickSetup(
            @Valid @RequestBody FamilyQuickSetupRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        // 1. Mettre à jour le profil utilisateur
        currentUser.setFirstName(request.getUserFirstName());
        currentUser = userRepository.save(currentUser);
        
        // 2. Créer la famille
        Family family = new Family();
        family.setName(request.getFamilyName());
        family.setCreatedBy(currentUser);
        family = familyRepository.save(family);
        
        // 3. Créer le FamilyMember avec rôle ADMIN
        FamilyMember member = new FamilyMember();
        member.setUser(currentUser);
        member.setFamily(family);
        member.setRole(FamilyRole.ADMIN);
        member.setNickname(request.getUserNickname());
        member.setJoinedAt(LocalDateTime.now());
        member = familyMemberRepository.save(member);
        
        // 4. Retourner la réponse
        return ResponseEntity.ok(new FamilyQuickSetupResponse(
            familyMapper.toResponse(family),
            familyMemberMapper.toResponse(member)
        ));
    }
}
```

### 9. Modifications CategoryController
Ajouter l'endpoint bulk:

```java
@RestController
@RequestMapping("/api/families/{familyId}/categories")
@RequiredArgsConstructor
public class CategoryController {
    // ... méthodes existantes ...
    
    @PostMapping("/bulk")
    public ResponseEntity<List<CategoryResponse>> addMultipleSystemCategories(
            @PathVariable Long familyId,
            @Valid @RequestBody BulkCategoriesRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        // Vérifier que l'utilisateur a accès à cette famille
        familyService.checkMemberAccess(familyId, currentUser, FamilyRole.PARENT);
        
        List<Category> createdCategories = new ArrayList<>();
        
        for (Long systemCategoryId : request.getSystemCategoryIds()) {
            // Récupérer la catégorie système
            SystemCategory systemCategory = systemCategoryRepository
                .findById(systemCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Catégorie système non trouvée: " + systemCategoryId));
            
            // Créer une copie pour la famille
            Category category = new Category();
            category.setFamily(familyRepository.getReferenceById(familyId));
            category.setName(systemCategory.getName());
            category.setType(systemCategory.getType());
            category.setIcon(systemCategory.getIcon());
            category.setColor(systemCategory.getColor());
            category.setSystemCategoryId(systemCategoryId);
            category.setActive(true);
            
            createdCategories.add(categoryRepository.save(category));
        }
        
        return ResponseEntity.ok(
            createdCategories.stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList())
        );
    }
}
```

### 10. Migration de base de données
Créer une migration Liquibase/Flyway:

```sql
-- V{version}__add_onboarding_tracking.sql

ALTER TABLE users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at TIMESTAMP,
ADD COLUMN first_name VARCHAR(100);

-- Marquer les utilisateurs existants comme ayant complété l'onboarding
UPDATE users 
SET onboarding_completed = TRUE,
    onboarding_completed_at = created_at
WHERE created_at < NOW() - INTERVAL '1 day';
```

## Points d'attention

### 1. Sécurité
- L'endpoint `/quick-setup` doit être accessible uniquement aux utilisateurs authentifiés qui n'ont pas encore de famille
- Vérifier que l'utilisateur ne crée qu'une seule famille lors du quick-setup
- Valider que les systemCategoryIds existent avant de créer les copies

### 2. Idempotence
- Si l'utilisateur appelle `/quick-setup` plusieurs fois, soit:
  - Retourner une erreur "Famille déjà créée"
  - Ou retourner la famille existante
- L'ajout de catégories en bulk doit éviter les doublons (vérifier si systemCategoryId déjà utilisé)

### 3. Transactions
- Utiliser `@Transactional` sur les méthodes de service
- En cas d'erreur lors du quick-setup, tout doit être rollback (famille + member)

### 4. Gestion des erreurs
- Retourner des messages d'erreur clairs pour le frontend
- Si une étape échoue, l'état d'onboarding ne doit pas changer

### 5. Performance
- Optimiser la requête `getOnboardingStatus` avec des joins pour éviter les N+1 queries
- Mettre en cache le statut d'onboarding si nécessaire

### 6. Tests
Créer des tests pour:
- Le calcul du statut d'onboarding dans différents scénarios
- Le quick-setup (création famille + member)
- L'ajout en bulk de catégories
- La validation des données

## Endpoints existants à vérifier

Ces endpoints doivent déjà exister et fonctionner correctement:
- `POST /api/auth/register` - Inscription basique
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `GET /api/system-categories` - Liste des catégories système
- `GET /api/system-categories/recommended` - Catégories recommandées
- `POST /api/families/{familyId}/categories` - Création catégorie individuelle
- `POST /api/families/{familyId}/transactions` - Création transaction

## Questions à résoudre

1. **Catégories système**: Existe-t-il déjà une table `system_categories` avec des catégories prédéfinies ? Si non, faut-il les créer ?
2. **Recommandations**: Comment déterminer quelles catégories sont "recommandées" ? (flag dans la table, liste codée en dur, ou logique métier ?)
3. **Familles multiples**: Que se passe-t-il si un utilisateur rejoint une deuxième famille après avoir complété l'onboarding ?
4. **Réinitialisation**: Faut-il permettre à un utilisateur de "refaire" l'onboarding ?
5. **Analytics**: Faut-il tracker les abandons à chaque étape pour analyser le taux de complétion ?

## Tâche demandée

Adapte le backend Spring Boot pour supporter ce workflow d'onboarding complet:

1. ✅ Ajouter les champs d'onboarding à l'entité User
2. ✅ Créer tous les DTOs nécessaires
3. ✅ Implémenter OnboardingService avec la logique de calcul de statut
4. ✅ Créer OnboardingController avec l'endpoint GET /onboarding-status
5. ✅ Ajouter l'endpoint POST /families/quick-setup
6. ✅ Ajouter l'endpoint POST /families/{familyId}/categories/bulk
7. ✅ Créer la migration de base de données
8. ✅ Ajouter des tests unitaires et d'intégration
9. ✅ Documenter les nouveaux endpoints (Swagger/OpenAPI)
10. ✅ Vérifier la sécurité et les validations

Assure-toi que le statut d'onboarding soit mis à jour automatiquement lorsque:
- Une famille est créée → `familyCreated = true`
- Des catégories sont ajoutées → `categoriesAdded = true`
- Une transaction est créée → `firstTransactionAdded = true`
- Toutes les étapes obligatoires sont complétées → `completed = true, completedAt = NOW()`

Le frontend appellera automatiquement `GET /users/me/onboarding-status` au login et au démarrage de l'app pour synchroniser l'état.
