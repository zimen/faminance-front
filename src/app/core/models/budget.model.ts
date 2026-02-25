/**
 * BudgetPeriod - Période du budget
 */
export enum BudgetPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

/**
 * Budget - Budget pour une catégorie
 */
export interface Budget {
  id?: number;
  familyId?: number;
  categoryId: number;
  category?: any; // Reference to category
  categoryName?: string;
  amount: number;
  // Legacy fields for compatibility
  month?: number;
  year?: number;
  plannedAmount?: number;
  actualAmount?: number;
  remainingAmount?: number;
  completionPercentage?: number;
  // New fields
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  spent: number;
  remaining: number;
  percentage: number;
  active: boolean;
}

/**
 * BudgetRequest - Données pour créer/modifier un budget
 */
export interface BudgetRequest {
  categoryId: number;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
}
