/**
 * Modèles TypeScript pour les modèles de budget
 */

import { RecurrencePattern } from './budget-forecast.model';
import { BudgetLine } from './budget-line.model';

export interface BudgetTemplate {
  id: number;
  familyId: number;
  name: string;
  description?: string;
  totalPlannedAmount: number;
  active: boolean;
  isDefault: boolean;
  items: BudgetTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTemplateItem {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  
  // Lignes budgétaires du template
  lines: BudgetTemplateLineTemplate[];
  
  // Totaux calculés (somme des lignes)
  totalPlannedAmount: number;
  
  // Legacy - pour compatibilité
  plannedAmount?: number;
  percentage?: number;
  notes?: string;
  displayOrder: number;
}

/**
 * BudgetTemplateLineTemplate - Ligne budgétaire dans un template
 */
export interface BudgetTemplateLineTemplate {
  id: number;
  label: string;
  description?: string;
  plannedAmount: number;
  
  // Configuration de récurrence
  recurrence: RecurrencePattern;
  dayOfMonth?: number;       // Pour MONTHLY: 1-31
  dayOfWeek?: number;        // Pour WEEKLY: 0-6 (0=dimanche)
  monthsInterval?: number;   // Pour QUARTERLY, YEARLY
  
  // Détection automatique
  autoDetectRecurrence: boolean;
  
  // Création automatique de transaction
  autoCreateTransaction: boolean;
  autoTransactionDescription?: string;
  
  notes?: string;
  displayOrder: number;
}

/**
 * Version simplifiée - Envoi direct des lignes avec categoryId
 */
export interface BudgetTemplateRequest {
  name: string;
  description?: string;
  isDefault: boolean;
  lines: BudgetTemplateLineRequest[];
}

/**
 * Version legacy - Structure hiérarchique items→lines (pour compatibilité backend)
 */
export interface BudgetTemplateRequestLegacy {
  name: string;
  description?: string;
  isDefault: boolean;
  items: BudgetTemplateItemRequest[];
}

export interface BudgetTemplateItemRequest {
  categoryId: number;
  plannedAmount?: number; // Legacy - optionnel si on a des lignes
  lines?: BudgetTemplateLineRequest[];
  notes?: string;
  displayOrder?: number;
}

/**
 * BudgetTemplateLineRequest - Requête pour créer/modifier une ligne template
 */
export interface BudgetTemplateLineRequest {
  categoryId: number; // ID de la catégorie
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

export interface BudgetComparisonReport {
  templateName: string;
  month: number;
  year: number;
  totalPlanned: number;
  totalActual: number;
  totalDifference: number;
  variancePercentage: number;
  items: BudgetComparisonItem[];
}

export interface BudgetComparisonItem {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  plannedAmount: number;
  actualAmount: number;
  difference: number;
  variancePercentage: number;
  status: 'on-track' | 'warning' | 'over-budget';
}

export interface BudgetTemplateSuggestion {
  templateId: number;
  templateName: string;
  adjustments: BudgetAdjustmentSuggestion[];
  analysisNote: string;
}

export interface BudgetAdjustmentSuggestion {
  categoryName: string;
  currentAmount: number;
  suggestedAmount: number;
  difference: number;
  reason: string;
}

export interface Budget {
  id: number;
  familyId: number;
  categoryId: number;
  categoryName: string;
  month: number;
  year: number;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  completionPercentage: number;
  notes?: string;
}

/**
 * BudgetInstance - Instance de budget mensuel générée depuis un template
 */
export interface BudgetInstance {
  id: number;
  familyId: number;
  templateId?: number;        // Référence au template source (si généré)
  templateName?: string;
  name: string;               // "Budget Mars 2026"
  month: number;
  year: number;
  lines: any | null;          // Retourné si groupByCategory=false
  linesByCategory: BudgetCategoryInstance[];  // Retourné avec groupByCategory=true
  
  // Totaux globaux
  totalPlanned: number;           // Total planifié (revenus - dépenses)
  totalActual: number;            // Total réel (revenus - dépenses)
  totalRemaining: number;         // Différence entre planifié et réel
  percentageUsed: number;
  
  // Totaux détaillés
  totalIncomePlanned: number;     // Somme des revenus planifiés
  totalIncomeActual: number;      // Somme des revenus réels
  totalExpensePlanned: number;    // Somme des dépenses planifiées
  totalExpenseActual: number;     // Somme des dépenses réelles
  
  createdAt: string;
  updatedAt: string;
}

/**
 * BudgetCategoryInstance - Catégorie dans un budget instancié
 */
import { CategoryType } from './category.model';

export interface BudgetCategoryInstance {
  id: number;
  budgetInstanceId: number;
  categoryId: number;
  categoryName: string;
  categoryType: CategoryType;  // INCOME ou EXPENSE
  categoryIcon: string;
  categoryColor: string;
  
  // Lignes budgétaires
  lines: BudgetLine[];
  
  // Totaux calculés (agrégés depuis les lignes)
  totalPlanned: number;
  totalActual: number;
  totalRemaining: number;
  percentageUsed: number;
  
  // Transactions non rattachées à une ligne
  unlinkedTransactionCount: number;
  unlinkedTransactionTotal: number;
  
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * BudgetInstanceRequest - Requête pour créer un budget mensuel
 */
export interface BudgetInstanceRequest {
  templateId?: number;  // Si on génère depuis un template
  name: string;
  month: number;
  year: number;
  categories?: BudgetCategoryInstanceRequest[];  lines?: Array<{
    categoryId: number;
    label: string;
    description?: string;
    plannedAmount: number;
    plannedDate?: string;
    displayOrder?: number;
  }>;}

/**
 * BudgetCategoryInstanceRequest - Requête pour créer une catégorie dans un budget
 */
export interface BudgetCategoryInstanceRequest {
  categoryId: number;
  lines: Array<{
    label: string;
    description?: string;
    plannedAmount: number;
    plannedDate?: string;
    displayOrder?: number;
  }>;
  displayOrder?: number;
}
