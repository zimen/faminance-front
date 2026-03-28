# Exemples de code Java pour l'implémentation de l'onboarding

## 1. OnboardingService.java (Version complète)

```java
package com.family.finance.service;

import com.family.finance.dto.onboarding.OnboardingStatusResponse;
import com.family.finance.dto.onboarding.OnboardingStatusResponse.StepsCompleted;
import com.family.finance.entity.User;
import com.family.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Calcule et retourne le statut d'onboarding de l'utilisateur
     * Met à jour automatiquement le statut si toutes les étapes sont complétées
     */
    @Transactional
    public OnboardingStatusResponse getOnboardingStatus(User currentUser) {
        log.debug("Calculating onboarding status for user: {}", currentUser.getEmail());

        // Étape 1: Compte créé (toujours true si authentifié)
        boolean accountCreated = true;

        // Étape 2: Famille créée (l'utilisateur a au moins un membership)
        boolean familyCreated = hasFamily(currentUser);

        // Étape 3: Catégories ajoutées (au moins une catégorie dans une famille)
        boolean categoriesAdded = hasCategories(currentUser);

        // Étape 4: Première transaction ajoutée (optionnelle)
        boolean firstTransactionAdded = hasTransaction(currentUser);

        // Calculer l'étape actuelle
        int currentStep = calculateCurrentStep(
            accountCreated, familyCreated, categoriesAdded, firstTransactionAdded
        );

        // L'onboarding est complété si les 3 étapes obligatoires sont faites
        // (firstTransaction est optionnelle)
        boolean completed = accountCreated && familyCreated && categoriesAdded;

        // Si vient d'être complété, marquer l'utilisateur
        if (completed && !Boolean.TRUE.equals(currentUser.getOnboardingCompleted())) {
            markOnboardingAsCompleted(currentUser);
        }

        // Construire la réponse
        return OnboardingStatusResponse.builder()
            .completed(completed)
            .currentStep(currentStep)
            .stepsCompleted(StepsCompleted.builder()
                .accountCreated(accountCreated)
                .familyCreated(familyCreated)
                .categoriesAdded(categoriesAdded)
                .firstTransactionAdded(firstTransactionAdded)
                .build())
            .completedAt(currentUser.getOnboardingCompletedAt())
            .build();
    }

    /**
     * Vérifie si l'utilisateur a au moins une famille
     */
    private boolean hasFamily(User user) {
        long familyCount = familyMemberRepository.countByUserId(user.getId());
        log.debug("User {} has {} family memberships", user.getId(), familyCount);
        return familyCount > 0;
    }

    /**
     * Vérifie si au moins une des familles de l'utilisateur a des catégories
     */
    private boolean hasCategories(User user) {
        long categoryCount = categoryRepository.countByUserFamilies(user.getId());
        log.debug("User {} has {} categories across all families", user.getId(), categoryCount);
        return categoryCount > 0;
    }

    /**
     * Vérifie si au moins une des familles de l'utilisateur a des transactions
     */
    private boolean hasTransaction(User user) {
        long transactionCount = transactionRepository.countByUserFamilies(user.getId());
        log.debug("User {} has {} transactions across all families", user.getId(), transactionCount);
        return transactionCount > 0;
    }

    /**
     * Calcule l'étape actuelle en fonction des étapes complétées
     */
    private int calculateCurrentStep(
        boolean accountCreated,
        boolean familyCreated,
        boolean categoriesAdded,
        boolean firstTransactionAdded
    ) {
        if (!accountCreated) return 1;
        if (!familyCreated) return 2;
        if (!categoriesAdded) return 3;
        if (!firstTransactionAdded) return 4;
        return 5; // Tout est complété
    }

    /**
     * Marque l'onboarding comme complété et sauvegarde
     */
    private void markOnboardingAsCompleted(User user) {
        log.info("Marking onboarding as completed for user: {}", user.getEmail());
        user.setOnboardingCompleted(true);
        user.setOnboardingCompletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Vérifie si l'utilisateur a terminé son onboarding
     */
    public boolean isOnboardingCompleted(User user) {
        return Boolean.TRUE.equals(user.getOnboardingCompleted());
    }

    /**
     * Réinitialise l'onboarding (pour tests ou admin)
     */
    @Transactional
    public void resetOnboarding(User user) {
        log.warn("Resetting onboarding for user: {}", user.getEmail());
        user.setOnboardingCompleted(false);
        user.setOnboardingCompletedAt(null);
        userRepository.save(user);
    }
}
```

## 2. Repository queries personnalisées

### CategoryRepository.java
```java
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Méthode existante
    List<Category> findByFamilyIdAndActiveTrue(Long familyId);
    
    // Nouvelle méthode pour l'onboarding
    @Query("""
        SELECT COUNT(c) 
        FROM Category c 
        JOIN c.family f 
        JOIN f.members m 
        WHERE m.user.id = :userId 
        AND c.active = true
    """)
    long countByUserFamilies(@Param("userId") Long userId);
}
```

### TransactionRepository.java
```java
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    // Méthodes existantes
    Page<Transaction> findByFamilyId(Long familyId, Pageable pageable);
    
    // Nouvelle méthode pour l'onboarding
    @Query("""
        SELECT COUNT(t) 
        FROM Transaction t 
        JOIN t.family f 
        JOIN f.members m 
        WHERE m.user.id = :userId
    """)
    long countByUserFamilies(@Param("userId") Long userId);
}
```

### FamilyMemberRepository.java
```java
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    
    // Méthodes existantes
    List<FamilyMember> findByFamilyId(Long familyId);
    List<FamilyMember> findByUserId(Long userId);
    
    // Nouvelle méthode pour l'onboarding
    long countByUserId(Long userId);
    
    boolean existsByUserIdAndFamilyId(Long userId, Long familyId);
}
```

## 3. FamilyService.java - Quick Setup

```java
package com.family.finance.service;

import com.family.finance.dto.family.*;
import com.family.finance.entity.*;
import com.family.finance.exception.*;
import com.family.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final FamilyMapper familyMapper;
    private final FamilyMemberMapper familyMemberMapper;

    /**
     * Création rapide d'une famille avec l'utilisateur comme ADMIN
     * Utilisé lors de l'onboarding
     */
    @Transactional
    public FamilyQuickSetupResponse quickSetup(
        FamilyQuickSetupRequest request,
        User currentUser
    ) {
        log.info("Quick setup for user: {} - family: {}", 
            currentUser.getEmail(), request.getFamilyName());

        // Vérifier si l'utilisateur n'a pas déjà une famille
        if (familyMemberRepository.existsByUserId(currentUser.getId())) {
            throw new BadRequestException(
                "L'utilisateur a déjà une famille. Utilisez l'endpoint standard de création."
            );
        }

        // 1. Mettre à jour le profil utilisateur avec son prénom
        currentUser.setFirstName(request.getUserFirstName());
        currentUser = userRepository.save(currentUser);
        log.debug("Updated user first name: {}", request.getUserFirstName());

        // 2. Créer la famille
        Family family = Family.builder()
            .name(request.getFamilyName())
            .createdBy(currentUser)
            .createdAt(LocalDateTime.now())
            .build();
        family = familyRepository.save(family);
        log.debug("Created family with ID: {}", family.getId());

        // 3. Créer le FamilyMember avec rôle ADMIN
        FamilyMember member = FamilyMember.builder()
            .user(currentUser)
            .family(family)
            .role(FamilyRole.ADMIN)
            .nickname(request.getUserNickname())
            .joinedAt(LocalDateTime.now())
            .active(true)
            .build();
        member = familyMemberRepository.save(member);
        log.debug("Created family member with role: ADMIN");

        // 4. Retourner la réponse
        return FamilyQuickSetupResponse.builder()
            .family(familyMapper.toResponse(family))
            .member(familyMemberMapper.toResponse(member))
            .build();
    }

    /**
     * Vérifie que l'utilisateur a accès à la famille avec le rôle minimum requis
     */
    public void checkMemberAccess(Long familyId, User user, FamilyRole minRole) {
        FamilyMember membership = familyMemberRepository
            .findByFamilyIdAndUserId(familyId, user.getId())
            .orElseThrow(() -> new ForbiddenException(
                "Vous n'êtes pas membre de cette famille"
            ));

        if (!membership.isActive()) {
            throw new ForbiddenException("Votre accès à cette famille est désactivé");
        }

        if (!hasMinRole(membership.getRole(), minRole)) {
            throw new ForbiddenException(
                "Vous n'avez pas les droits nécessaires. Rôle requis: " + minRole
            );
        }
    }

    /**
     * Vérifie si le rôle actuel satisfait le rôle minimum requis
     * Hiérarchie: ADMIN > PARENT > MEMBER
     */
    private boolean hasMinRole(FamilyRole currentRole, FamilyRole minRole) {
        int currentLevel = getRoleLevel(currentRole);
        int minLevel = getRoleLevel(minRole);
        return currentLevel >= minLevel;
    }

    private int getRoleLevel(FamilyRole role) {
        return switch (role) {
            case ADMIN -> 3;
            case PARENT -> 2;
            case MEMBER -> 1;
        };
    }
}
```

## 4. CategoryService.java - Bulk Add

```java
package com.family.finance.service;

import com.family.finance.dto.category.*;
import com.family.finance.entity.*;
import com.family.finance.exception.*;
import com.family.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SystemCategoryRepository systemCategoryRepository;
    private final FamilyRepository familyRepository;
    private final CategoryMapper categoryMapper;

    /**
     * Ajoute plusieurs catégories système à la famille en une seule opération
     * Utilisé lors de l'onboarding pour accélérer la configuration
     */
    @Transactional
    public List<CategoryResponse> addMultipleSystemCategories(
        Long familyId,
        BulkCategoriesRequest request,
        User currentUser
    ) {
        log.info("Adding {} system categories to family {}", 
            request.getSystemCategoryIds().size(), familyId);

        // Vérifier que la famille existe
        Family family = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Famille non trouvée: " + familyId
            ));

        // Récupérer les catégories système déjà utilisées par cette famille
        Set<Long> existingSystemCategoryIds = categoryRepository
            .findByFamilyId(familyId).stream()
            .map(Category::getSystemCategoryId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());

        List<Category> createdCategories = new ArrayList<>();

        for (Long systemCategoryId : request.getSystemCategoryIds()) {
            // Éviter les doublons
            if (existingSystemCategoryIds.contains(systemCategoryId)) {
                log.debug("Category system {} already exists for family {}, skipping", 
                    systemCategoryId, familyId);
                continue;
            }

            // Récupérer la catégorie système
            SystemCategory systemCategory = systemCategoryRepository
                .findById(systemCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Catégorie système non trouvée: " + systemCategoryId
                ));

            // Créer une copie pour la famille
            Category category = Category.builder()
                .family(family)
                .name(systemCategory.getName())
                .type(systemCategory.getType())
                .icon(systemCategory.getIcon())
                .color(systemCategory.getColor())
                .systemCategoryId(systemCategoryId)
                .active(true)
                .build();

            category = categoryRepository.save(category);
            createdCategories.add(category);
            log.debug("Created category: {} ({})", category.getName(), category.getId());
        }

        log.info("Created {} new categories for family {}", 
            createdCategories.size(), familyId);

        return createdCategories.stream()
            .map(categoryMapper::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupère les catégories système recommandées
     */
    public List<SystemCategoryResponse> getRecommendedSystemCategories() {
        List<SystemCategory> recommended = systemCategoryRepository
            .findByRecommendedTrueOrderByUsageCountDesc();
        
        return recommended.stream()
            .map(categoryMapper::toSystemCategoryResponse)
            .collect(Collectors.toList());
    }
}
```

## 5. Controllers

### OnboardingController.java
```java
package com.family.finance.controller;

import com.family.finance.dto.onboarding.OnboardingStatusResponse;
import com.family.finance.entity.User;
import com.family.finance.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Onboarding", description = "Gestion du processus d'onboarding")
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @Operation(summary = "Récupère le statut d'onboarding de l'utilisateur connecté")
    @GetMapping("/onboarding-status")
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(
            @AuthenticationPrincipal User currentUser) {
        OnboardingStatusResponse status = onboardingService.getOnboardingStatus(currentUser);
        return ResponseEntity.ok(status);
    }

    @Operation(summary = "Réinitialise l'onboarding (admin/dev uniquement)")
    @DeleteMapping("/onboarding-status")
    public ResponseEntity<Void> resetOnboarding(
            @AuthenticationPrincipal User currentUser) {
        onboardingService.resetOnboarding(currentUser);
        return ResponseEntity.noContent().build();
    }
}
```

### FamilyController.java (extrait)
```java
@Tag(name = "Families", description = "Gestion des familles")
@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @Operation(summary = "Configuration rapide famille + profil (onboarding)")
    @PostMapping("/quick-setup")
    public ResponseEntity<FamilyQuickSetupResponse> quickSetup(
            @Valid @RequestBody FamilyQuickSetupRequest request,
            @AuthenticationPrincipal User currentUser) {
        FamilyQuickSetupResponse response = familyService.quickSetup(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

### CategoryController.java (extrait)
```java
@Tag(name = "Categories", description = "Gestion des catégories")
@RestController
@RequestMapping("/api/families/{familyId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final FamilyService familyService;

    @Operation(summary = "Ajoute plusieurs catégories système en une fois (onboarding)")
    @PostMapping("/bulk")
    public ResponseEntity<List<CategoryResponse>> addMultipleSystemCategories(
            @PathVariable Long familyId,
            @Valid @RequestBody BulkCategoriesRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        // Vérifier les droits (PARENT minimum)
        familyService.checkMemberAccess(familyId, currentUser, FamilyRole.PARENT);
        
        List<CategoryResponse> categories = categoryService
            .addMultipleSystemCategories(familyId, request, currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(categories);
    }
}
```

## 6. Tests unitaires

### OnboardingServiceTest.java
```java
package com.family.finance.service;

import com.family.finance.dto.onboarding.OnboardingStatusResponse;
import com.family.finance.entity.User;
import com.family.finance.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FamilyMemberRepository familyMemberRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private OnboardingService onboardingService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .email("test@example.com")
            .onboardingCompleted(false)
            .build();
    }

    @Test
    void getOnboardingStatus_WhenNewUser_ShouldReturnStep1() {
        // Given
        when(familyMemberRepository.countByUserId(anyLong())).thenReturn(0L);
        when(categoryRepository.countByUserFamilies(anyLong())).thenReturn(0L);
        when(transactionRepository.countByUserFamilies(anyLong())).thenReturn(0L);

        // When
        OnboardingStatusResponse status = onboardingService.getOnboardingStatus(testUser);

        // Then
        assertThat(status.getCurrentStep()).isEqualTo(2); // Account created, next step is family
        assertThat(status.getCompleted()).isFalse();
        assertThat(status.getStepsCompleted().getAccountCreated()).isTrue();
        assertThat(status.getStepsCompleted().getFamilyCreated()).isFalse();
    }

    @Test
    void getOnboardingStatus_WhenFamilyAndCategoriesExist_ShouldBeCompleted() {
        // Given
        when(familyMemberRepository.countByUserId(anyLong())).thenReturn(1L);
        when(categoryRepository.countByUserFamilies(anyLong())).thenReturn(3L);
        when(transactionRepository.countByUserFamilies(anyLong())).thenReturn(0L);

        // When
        OnboardingStatusResponse status = onboardingService.getOnboardingStatus(testUser);

        // Then
        assertThat(status.getCompleted()).isTrue();
        assertThat(status.getStepsCompleted().getFamilyCreated()).isTrue();
        assertThat(status.getStepsCompleted().getCategoriesAdded()).isTrue();
        verify(userRepository).save(testUser); // Should mark as completed
        assertThat(testUser.getOnboardingCompleted()).isTrue();
        assertThat(testUser.getOnboardingCompletedAt()).isNotNull();
    }
}
```

## 7. Migration SQL complète

```sql
-- V10__add_onboarding_support.sql

-- Ajouter colonnes d'onboarding à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

-- Créer un index pour optimiser les queries d'onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON users(onboarding_completed);

-- Marquer les utilisateurs existants (créés avant aujourd'hui) comme ayant complété l'onboarding
-- Cela évite de forcer l'onboarding aux utilisateurs déjà actifs
UPDATE users 
SET onboarding_completed = TRUE,
    onboarding_completed_at = created_at
WHERE created_at < CURRENT_DATE
  AND onboarding_completed = FALSE;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Indique si l''utilisateur a terminé le processus d''onboarding';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Date et heure de complétion de l''onboarding';
COMMENT ON COLUMN users.first_name IS 'Prénom de l''utilisateur (ajouté lors de l''onboarding)';
```

## 8. Configuration Swagger (OpenAPI)

```java
package com.family.finance.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Faminance API")
                .version("1.0")
                .description("""
                    API de gestion financière familiale
                    
                    ## Onboarding
                    Le processus d'onboarding guide les nouveaux utilisateurs à travers 4 étapes:
                    1. Inscription (POST /api/auth/register)
                    2. Configuration famille + profil (POST /api/families/quick-setup)
                    3. Ajout de catégories (POST /api/families/{familyId}/categories/bulk)
                    4. Première transaction (POST /api/families/{familyId}/transactions) - optionnel
                    
                    Utilisez GET /api/users/me/onboarding-status pour suivre la progression.
                    """))
            .addServersItem(new Server()
                .url("http://localhost:8080")
                .description("Serveur de développement"));
    }
}
```

Voilà tous les exemples de code Java nécessaires pour implémenter le workflow d'onboarding complet côté backend !
