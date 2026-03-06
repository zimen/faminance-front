/**
 * Modèles TypeScript pour les modèles de budget
 */

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
  plannedAmount: number;
  percentage: number;
  notes?: string;
  displayOrder: number;
}

export interface BudgetTemplateRequest {
  name: string;
  description?: string;
  isDefault: boolean;
  items: BudgetTemplateItemRequest[];
}

export interface BudgetTemplateItemRequest {
  categoryId: number;
  plannedAmount: number;
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
