# Backend Implementation Guide - Budget Lines System

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Modèles de données (Entités JPA)](#modèles-de-données)
3. [Structure de la base de données](#structure-de-la-base-de-données)
4. [API Endpoints](#api-endpoints)
5. [Logique métier](#logique-métier)
6. [Services](#services)
7. [DTOs](#dtos)
8. [Triggers et événements](#triggers-et-événements)
9. [Sécurité et validation](#sécurité-et-validation)
10. [Tests](#tests)

---

## Vue d'ensemble

Le système de lignes budgétaires permet :
- ✅ Créer des templates avec lignes budgétaires détaillées
- ✅ Générer des budgets mensuels depuis les templates
- ✅ Rattacher les transactions aux lignes budgétaires
- ✅ Calcul automatique des montants effectifs
- ✅ Système d'alertes et notifications
- ✅ Prévisions et suggestions d'optimisation
- ✅ Gestion de la récurrence

---

## Modèles de données

### 1. BudgetTemplate (existant - à enrichir)

```java
@Entity
@Table(name = "budget_templates")
public class BudgetTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;
    
    private String name;
    private String description;
    private Boolean isDefault = false;
    private Boolean active = true;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetTemplateItem> items = new ArrayList<>();
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}
```

### 2. BudgetTemplateItem (enrichi)

```java
@Entity
@Table(name = "budget_template_items")
public class BudgetTemplateItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private BudgetTemplate template;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    // 🔥 NOUVEAU : Lignes budgétaires du template
    @OneToMany(mappedBy = "templateItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetTemplateLineTemplate> lines = new ArrayList<>();
    
    private Integer displayOrder = 0;
    private String notes;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    // Méthodes calculées
    public BigDecimal getTotalPlannedAmount() {
        return lines.stream()
            .map(BudgetTemplateLineTemplate::getPlannedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

### 3. BudgetTemplateLineTemplate (NOUVEAU)

```java
@Entity
@Table(name = "budget_template_lines")
public class BudgetTemplateLineTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id", nullable = false)
    private BudgetTemplateItem templateItem;
    
    @Column(nullable = false)
    private String label;
    
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal plannedAmount;
    
    // Configuration de récurrence
    @Enumerated(EnumType.STRING)
    private RecurrencePattern recurrence = RecurrencePattern.NONE;
    
    private Integer dayOfMonth;  // 1-31 pour MONTHLY
    private Integer dayOfWeek;   // 0-6 pour WEEKLY
    private Integer monthsInterval;
    
    // Détection automatique
    private Boolean autoDetectRecurrence = false;
    
    // Création automatique de transaction
    private Boolean autoCreateTransaction = false;
    private String autoTransactionDescription;
    
    private String notes;
    private Integer displayOrder = 0;
    
    @CreatedDate
    private LocalDateTime createdAt;
}

public enum RecurrencePattern {
    NONE, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
}
```

### 4. BudgetInstance (NOUVEAU)

```java
@Entity
@Table(name = "budget_instances")
public class BudgetInstance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private BudgetTemplate template;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private Integer month;  // 1-12
    
    @Column(nullable = false)
    private Integer year;
    
    @OneToMany(mappedBy = "budgetInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetCategoryInstance> categories = new ArrayList<>();
    
    // Totaux calculés (mis à jour par trigger)
    @Column(precision = 15, scale = 2)
    private BigDecimal totalPlanned = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalActual = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalRemaining = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal percentageUsed = BigDecimal.ZERO;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Contrainte unique : un seul budget par famille/mois/année
    @UniqueConstraint(columnNames = {"family_id", "month", "year"})
}
```

### 5. BudgetCategoryInstance (NOUVEAU)

```java
@Entity
@Table(name = "budget_category_instances")
public class BudgetCategoryInstance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_instance_id", nullable = false)
    private BudgetInstance budgetInstance;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @OneToMany(mappedBy = "categoryInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetLine> lines = new ArrayList<>();
    
    // Totaux calculés
    @Column(precision = 15, scale = 2)
    private BigDecimal totalPlanned = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalActual = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalRemaining = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal percentageUsed = BigDecimal.ZERO;
    
    // Transactions non rattachées
    private Integer unlinkedTransactionCount = 0;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal unlinkedTransactionTotal = BigDecimal.ZERO;
    
    private Integer displayOrder = 0;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

### 6. BudgetLine (NOUVEAU)

```java
@Entity
@Table(name = "budget_lines")
public class BudgetLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_category_instance_id", nullable = false)
    private BudgetCategoryInstance categoryInstance;
    
    @Column(nullable = false)
    private String label;
    
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal plannedAmount;
    
    // Calculé automatiquement depuis les transactions
    @Column(precision = 15, scale = 2)
    private BigDecimal actualAmount = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal remaining = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal percentageUsed = BigDecimal.ZERO;
    
    private LocalDate plannedDate;
    
    // Transactions liées
    @OneToMany(mappedBy = "budgetLine")
    private List<Transaction> transactions = new ArrayList<>();
    
    private Integer transactionCount = 0;
    
    @Enumerated(EnumType.STRING)
    private BudgetLineStatus status = BudgetLineStatus.EMPTY;
    
    private Integer displayOrder = 0;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

public enum BudgetLineStatus {
    EMPTY, PARTIAL, ON_TRACK, COMPLETED, OVER
}
```

### 7. Transaction (à modifier)

```java
@Entity
@Table(name = "transactions")
public class Transaction {
    // ... champs existants ...
    
    // 🔥 NOUVEAU : Rattachement à une ligne budgétaire
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_line_id")
    private BudgetLine budgetLine;
    
    // ... reste inchangé ...
}
```

### 8. BudgetNotificationRule (NOUVEAU)

```java
@Entity
@Table(name = "budget_notification_rules")
public class BudgetNotificationRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;
    
    private Boolean enabled = true;
    
    @Enumerated(EnumType.STRING)
    private TriggerType triggerType;  // PERCENTAGE, ABSOLUTE_REMAINING, OVERRUN
    
    private BigDecimal threshold;
    
    @Enumerated(EnumType.STRING)
    private AlertScope scope;  // LINE, CATEGORY, BUDGET
    
    @ElementCollection
    @CollectionTable(name = "notification_channels")
    private List<NotificationChannel> channels;  // IN_APP, EMAIL, PUSH
    
    @ElementCollection
    @CollectionTable(name = "notification_recipients")
    private List<Long> recipientMemberIds;
    
    private String customMessage;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

---

## Structure de la base de données

```sql
-- Templates et lignes de templates
CREATE TABLE budget_templates (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_template_items (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    display_order INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_template_lines (
    id BIGSERIAL PRIMARY KEY,
    template_item_id BIGINT NOT NULL REFERENCES budget_template_items(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    planned_amount DECIMAL(15,2) NOT NULL,
    recurrence VARCHAR(20) DEFAULT 'NONE',
    day_of_month INT,
    day_of_week INT,
    months_interval INT,
    auto_detect_recurrence BOOLEAN DEFAULT FALSE,
    auto_create_transaction BOOLEAN DEFAULT FALSE,
    auto_transaction_description VARCHAR(255),
    notes TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instances de budgets mensuels
CREATE TABLE budget_instances (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES budget_templates(id),
    name VARCHAR(255) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    total_planned DECIMAL(15,2) DEFAULT 0,
    total_actual DECIMAL(15,2) DEFAULT 0,
    total_remaining DECIMAL(15,2) DEFAULT 0,
    percentage_used DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, month, year)
);

CREATE TABLE budget_category_instances (
    id BIGSERIAL PRIMARY KEY,
    budget_instance_id BIGINT NOT NULL REFERENCES budget_instances(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    total_planned DECIMAL(15,2) DEFAULT 0,
    total_actual DECIMAL(15,2) DEFAULT 0,
    total_remaining DECIMAL(15,2) DEFAULT 0,
    percentage_used DECIMAL(5,2) DEFAULT 0,
    unlinked_transaction_count INT DEFAULT 0,
    unlinked_transaction_total DECIMAL(15,2) DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_lines (
    id BIGSERIAL PRIMARY KEY,
    budget_category_instance_id BIGINT NOT NULL REFERENCES budget_category_instances(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    planned_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    remaining DECIMAL(15,2) DEFAULT 0,
    percentage_used DECIMAL(5,2) DEFAULT 0,
    planned_date DATE,
    transaction_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'EMPTY',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modification de la table transactions
ALTER TABLE transactions ADD COLUMN budget_line_id BIGINT REFERENCES budget_lines(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_budget_line ON transactions(budget_line_id);
CREATE INDEX idx_budget_instances_family_month ON budget_instances(family_id, month, year);
CREATE INDEX idx_budget_lines_category ON budget_lines(budget_category_instance_id);

-- Notifications
CREATE TABLE budget_notification_rules (
    id BIGSERIAL PRIMARY KEY,
    family_id BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    trigger_type VARCHAR(50) NOT NULL,
    threshold DECIMAL(15,2) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    custom_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_channels (
    rule_id BIGINT REFERENCES budget_notification_rules(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL
);

CREATE TABLE notification_recipients (
    rule_id BIGINT REFERENCES budget_notification_rules(id) ON DELETE CASCADE,
    member_id BIGINT REFERENCES family_members(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Budget Instances

```
GET    /api/families/{familyId}/budgets/active
GET    /api/families/{familyId}/budgets/by-month?month={month}&year={year}
GET    /api/families/{familyId}/budgets/{budgetId}
GET    /api/families/{familyId}/budgets
POST   /api/families/{familyId}/budgets
POST   /api/families/{familyId}/budgets/generate
PUT    /api/families/{familyId}/budgets/{budgetId}
DELETE /api/families/{familyId}/budgets/{budgetId}
POST   /api/families/{familyId}/budgets/{budgetId}/recalculate
POST   /api/families/{familyId}/budgets/{budgetId}/copy
GET    /api/families/{familyId}/budgets/exists?month={month}&year={year}
```

### Budget Lines

```
GET    /api/families/{familyId}/budgets/{budgetId}/categories/{categoryId}/lines
GET    /api/families/{familyId}/budgets/{budgetId}/lines/{lineId}
GET    /api/families/{familyId}/budgets/{budgetId}/lines/{lineId}/details
POST   /api/families/{familyId}/budgets/{budgetId}/categories/{categoryId}/lines
PUT    /api/families/{familyId}/budgets/{budgetId}/lines/{lineId}
DELETE /api/families/{familyId}/budgets/{budgetId}/lines/{lineId}
POST   /api/families/{familyId}/budgets/{budgetId}/lines/{lineId}/recalculate
GET    /api/families/{familyId}/budgets/{budgetId}/categories/{categoryId}/lines/suggestions?amount={amount}&date={date}
```

### Prévisions et Suggestions

```
GET    /api/families/{familyId}/budgets/{budgetId}/forecast
GET    /api/families/{familyId}/budget-templates/{templateId}/suggestions?months={months}
GET    /api/families/{familyId}/budgets/compare?fromMonth={m}&fromYear={y}&toMonth={m}&toYear={y}
GET    /api/families/{familyId}/budgets/detect-recurrence?lineLabel={label}&months={months}
```

### Notifications

```
GET    /api/families/{familyId}/budget-notifications/rules
POST   /api/families/{familyId}/budget-notifications/rules
PUT    /api/families/{familyId}/budget-notifications/rules/{ruleId}
DELETE /api/families/{familyId}/budget-notifications/rules/{ruleId}
GET    /api/families/{familyId}/budget-notifications?unread={true/false}
PATCH  /api/families/{familyId}/budget-notifications/{notificationId}/read
PATCH  /api/families/{familyId}/budget-notifications/read-all
```

---

## Logique métier

### Recalcul automatique des montants

```java
@Service
public class BudgetLineRecalculationService {
    
    /**
     * Recalculer le montant effectif d'une ligne budgétaire
     */
    @Transactional
    public BudgetLine recalculateLine(Long budgetLineId) {
        BudgetLine line = budgetLineRepository.findById(budgetLineId)
            .orElseThrow(() -> new ResourceNotFoundException("BudgetLine not found"));
        
        // Récupérer toutes les transactions rattachées
        List<Transaction> transactions = transactionRepository
            .findByBudgetLineId(budgetLineId);
        
        // Calculer le total
        BigDecimal actualAmount = transactions.stream()
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Mettre à jour la ligne
        line.setActualAmount(actualAmount);
        line.setTransactionCount(transactions.size());
        line.setRemaining(line.getPlannedAmount().subtract(actualAmount));
        
        // Calculer le pourcentage
        if (line.getPlannedAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentage = actualAmount
                .divide(line.getPlannedAmount(), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            line.setPercentageUsed(percentage);
        }
        
        // Calculer le statut
        line.setStatus(calculateStatus(line));
        
        BudgetLine updated = budgetLineRepository.save(line);
        
        // Recalculer les totaux de la catégorie
        recalculateCategoryTotals(line.getCategoryInstance().getId());
        
        return updated;
    }
    
    private BudgetLineStatus calculateStatus(BudgetLine line) {
        if (line.getActualAmount().compareTo(BigDecimal.ZERO) == 0) {
            return BudgetLineStatus.EMPTY;
        }
        
        BigDecimal percentage = line.getPercentageUsed();
        
        if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            return BudgetLineStatus.OVER;
        }
        if (percentage.compareTo(BigDecimal.valueOf(100)) == 0) {
            return BudgetLineStatus.COMPLETED;
        }
        if (percentage.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return BudgetLineStatus.ON_TRACK;
        }
        
        return BudgetLineStatus.PARTIAL;
    }
    
    @Transactional
    public void recalculateCategoryTotals(Long categoryInstanceId) {
        BudgetCategoryInstance category = categoryInstanceRepository
            .findById(categoryInstanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        List<BudgetLine> lines = category.getLines();
        
        BigDecimal totalPlanned = lines.stream()
            .map(BudgetLine::getPlannedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalActual = lines.stream()
            .map(BudgetLine::getActualAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        category.setTotalPlanned(totalPlanned);
        category.setTotalActual(totalActual);
        category.setTotalRemaining(totalPlanned.subtract(totalActual));
        
        if (totalPlanned.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentage = totalActual
                .divide(totalPlanned, 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            category.setPercentageUsed(percentage);
        }
        
        categoryInstanceRepository.save(category);
        
        // Recalculer les totaux du budget
        recalculateBudgetTotals(category.getBudgetInstance().getId());
    }
}
```

### Génération de budget depuis template

```java
@Service
public class BudgetGenerationService {
    
    @Transactional
    public BudgetInstance generateFromTemplate(
        Long familyId,
        Long templateId,
        int month,
        int year
    ) {
        BudgetTemplate template = budgetTemplateRepository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        // Vérifier qu'un budget n'existe pas déjà
        Optional<BudgetInstance> existing = budgetInstanceRepository
            .findByFamilyIdAndMonthAndYear(familyId, month, year);
        
        if (existing.isPresent()) {
            throw new IllegalStateException("Budget already exists for this month");
        }
        
        // Créer l'instance de budget
        BudgetInstance budget = new BudgetInstance();
        budget.setFamily(template.getFamily());
        budget.setTemplate(template);
        budget.setName(template.getName() + " - " + getMonthName(month) + " " + year);
        budget.setMonth(month);
        budget.setYear(year);
        
        BudgetInstance savedBudget = budgetInstanceRepository.save(budget);
        
        // Générer les catégories et lignes
        for (BudgetTemplateItem templateItem : template.getItems()) {
            BudgetCategoryInstance categoryInstance = new BudgetCategoryInstance();
            categoryInstance.setBudgetInstance(savedBudget);
            categoryInstance.setCategory(templateItem.getCategory());
            categoryInstance.setDisplayOrder(templateItem.getDisplayOrder());
            
            BudgetCategoryInstance savedCategory = categoryInstanceRepository.save(categoryInstance);
            
            // Générer les lignes depuis le template
            for (BudgetTemplateLineTemplate lineTemplate : templateItem.getLines()) {
                BudgetLine line = new BudgetLine();
                line.setCategoryInstance(savedCategory);
                line.setLabel(lineTemplate.getLabel());
                line.setDescription(lineTemplate.getDescription());
                line.setPlannedAmount(lineTemplate.getPlannedAmount());
                line.setDisplayOrder(lineTemplate.getDisplayOrder());
                
                // Calculer la date prévue si dayOfMonth est défini
                if (lineTemplate.getDayOfMonth() != null) {
                    LocalDate plannedDate = LocalDate.of(year, month, lineTemplate.getDayOfMonth());
                    line.setPlannedDate(plannedDate);
                }
                
                budgetLineRepository.save(line);
            }
        }
        
        // Recalculer les totaux
        recalculationService.recalculateBudgetTotals(savedBudget.getId());
        
        return budgetInstanceRepository.findById(savedBudget.getId()).get();
    }
}
```

---

## Tests recommandés

```java
@SpringBootTest
class BudgetLineIntegrationTest {
    
    @Test
    void testRecalculationAfterTransactionCreation() {
        // Given: Une ligne budgétaire avec 100€ prévu
        // When: Création d'une transaction de 50€ rattachée à cette ligne
        // Then: La ligne doit afficher 50€ effectif et 50% d'utilisation
    }
    
    @Test
    void testBudgetGenerationFromTemplate() {
        // Given: Un template avec 3 catégories et 5 lignes au total
        // When: Génération du budget pour Mars 2026
        // Then: Le budget doit contenir 3 catégories et 5 lignes
    }
    
    @Test
    void testAlertTriggering() {
        // Given: Une ligne avec 100€ prévu et une règle d'alerte à 80%
        // When: Ajout d'une transaction portant le total à 85€
        // Then: Une alerte doit être déclenchée
    }
}
```

---

## Points d'attention

### Performance
- Indexer les colonnes fréquemment utilisées (family_id, month, year, budget_line_id)
- Utiliser le lazy loading pour les relations
- Mettre en cache les budgets actifs

### Sécurité
- Vérifier que l'utilisateur appartient à la famille avant toute opération
- Valider les montants (positifs, limites raisonnables)
- Limiter le nombre de lignes par catégorie (10 max)

### Maintenance
- Logger les recalculs automatiques
- Monitorer les performances des triggers
- Prévoir un système de migration si changement de schéma

---

## Prochaines étapes

1. ✅ Créer les entités JPA
2. ✅ Créer les repositories
3. ✅ Implémenter les services métier
4. ✅ Créer les contrôleurs REST
5. ✅ Ajouter les tests unitaires
6. ✅ Ajouter les tests d'intégration
7. ✅ Documenter l'API (Swagger)
8. ✅ Intégrer avec le frontend

---

Cette documentation devrait vous permettre d'implémenter le backend complet. N'hésitez pas à adapter selon vos besoins spécifiques !
