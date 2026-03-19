/**
 * Modèles pour la récurrence et les prévisions budgétaires
 */

/**
 * RecurrencePattern - Pattern de récurrence
 */
export enum RecurrencePattern {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

/**
 * RecurrenceDetection - Détection automatique de récurrence
 */
export interface RecurrenceDetection {
  lineLabel: string;
  transactionCount: number;
  
  detectedPattern?: {
    recurrence: RecurrencePattern;
    confidence: number;      // 0-100%
    dayOfMonth?: number;
    dayOfWeek?: number;
    averageAmount: number;
    variance: number;
  };
  
  suggestion: string;
  historicalTransactions: Array<{
    date: string;
    amount: number;
    description: string;
  }>;
}

/**
 * BudgetOptimizationSuggestion - Suggestion d'optimisation
 */
export interface BudgetOptimizationSuggestion {
  budgetLineId: number;
  lineName: string;
  categoryName: string;
  
  current: {
    planned: number;
    averageActual: number;  // Moyenne des 3-6 derniers mois
    variance: number;
    usagePercentage: number;
  };
  
  suggestion: {
    newPlanned: number;
    reason: string;
    confidence: number;  // 0-100%
    savingsPotential?: number;
    additionalNeeded?: number;
  };
  
  historicalData: Array<{
    month: string;
    planned: number;
    actual: number;
  }>;
}

/**
 * MonthEndForecast - Prévision de fin de mois
 */
export interface MonthEndForecast {
  budgetId: number;
  budgetName: string;
  currentDate: string;
  daysRemaining: number;
  monthProgress: number; // 0-100%
  
  overall: {
    plannedTotal: number;
    currentSpent: number;
    projectedEnd: number;
    projectedVariance: number;
    projectedVariancePercentage: number;
    onTrack: boolean;
    confidence: number; // 0-100%
  };
  
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    planned: number;
    current: number;
    projected: number;
    variance: number;
    onTrack: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  
  recommendations: string[];
}

/**
 * BudgetComparison - Comparaison multi-mois
 */
export interface BudgetComparison {
  months: Array<{
    month: number;
    year: number;
    name: string;
    totalPlanned: number;
    totalActual: number;
    compliance: number; // % de respect du budget
    variance: number;
  }>;
  
  trends: {
    averageMonthlySpending: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    percentageChange: number; // vs mois précédent
    standardDeviation: number;
  };
  
  insights: string[];
  
  topCategories: Array<{
    categoryName: string;
    totalSpent: number;
    percentageOfTotal: number;
  }>;
}

/**
 * AnomalyDetection - Détection d'anomalies
 */
export interface AnomalyDetection {
  budgetLineId: number;
  lineName: string;
  categoryName: string;
  
  currentAmount: number;
  historicalAverage: number;
  standardDeviation: number;
  
  isAnomaly: boolean;
  anomalyType: 'SPIKE' | 'DROP' | 'NONE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  
  message: string;
  suggestedAction?: string;
}
