/**
 * Modèles pour les lignes budgétaires détaillées
 */

/**
 * BudgetLine - Ligne budgétaire instanciée dans un budget mensuel
 */
export interface BudgetLine {
  id: number;
  budgetCategoryInstanceId: number;
  label: string;
  description?: string;
  plannedAmount: number;
  
  // Montant effectif calculé automatiquement (somme des transactions liées)
  actualAmount: number;
  remaining: number;
  percentageUsed: number;
  
  // Dates
  plannedDate?: string; // Format ISO "2026-03-05"
  
  // Relations
  transactionCount: number;
  transactions?: BudgetLineTransaction[];
  
  // État
  status: BudgetLineStatus;
  
  // Métadonnées
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * BudgetLineRequest - Données pour créer/modifier une ligne budgétaire
 */
export interface BudgetLineRequest {
  label: string;
  description?: string;
  plannedAmount: number;
  plannedDate?: string;
  displayOrder?: number;
}

/**
 * BudgetLineTransaction - Association transaction <-> ligne budgétaire
 */
export interface BudgetLineTransaction {
  id: number;
  budgetLineId: number;
  transactionId: number;
  
  // Informations dénormalisées pour l'affichage
  transactionDate: string;
  transactionDescription: string;
  transactionAmount: number;
  
  linkedDate: string;
  linkedByMemberId?: number;
}

/**
 * BudgetLineStatus - État d'une ligne budgétaire
 */
export enum BudgetLineStatus {
  EMPTY = 'EMPTY',           // Aucune transaction (0€ effectif)
  PARTIAL = 'PARTIAL',       // Partiellement utilisé (< 80%)
  ON_TRACK = 'ON_TRACK',     // Utilisé entre 80% et 100%
  COMPLETED = 'COMPLETED',   // Exactement 100%
  OVER = 'OVER'              // Dépassé (> 100%)
}

/**
 * BudgetLineWithDetails - Ligne budgétaire avec détails complets
 */
export interface BudgetLineWithDetails extends BudgetLine {
  category: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };
  transactions: BudgetLineTransaction[];
}

/**
 * Configuration des limites
 */
export const BUDGET_LINE_LIMITS = {
  MAX_LINES_PER_CATEGORY: 10,
  WARNING_THRESHOLD: 8,
  RECOMMENDED: 5
};
