/**
 * TopCategoryStatistics - Statistiques détaillées par catégorie
 */
export interface TopCategoryStatistics {
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/**
 * MonthlyStatistics - Statistiques mensuelles d'une famille
 * Correspond à la réponse API de GET /families/{id}/statistics
 */
export interface MonthlyStatistics {
  familyId: number;
  familyName: string | null;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalBudgetPlanned: number;
  totalBudgetActual: number;
  totalBudgetRemaining: number;
  budgetCompletionPercentage: number;
  expensesByCategory: { [key: string]: number };
  incomesByCategory: { [key: string]: number };
  expensesByMember: { [key: string]: number };
  incomesByMember: { [key: string]: number };
  topExpenseCategories: TopCategoryStatistics[];
  topIncomeCategories: TopCategoryStatistics[];
  monthlyEvolution: any | null; // À typer plus précisément si besoin
}

/**
 * CategoryStatistics - DEPRECATED: Utiliser TopCategoryStatistics à la place
 * @deprecated
 */
export interface CategoryStatistics {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

/**
 * Statistics - Statistiques financières de la famille
 */
export interface Statistics {
  familyId: number;
  period: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionsCount: number;
  categoryBreakdown: CategoryStats[];
  memberBreakdown: MemberStats[];
  monthlyTrend: MonthlyStats[];
}

/**
 * CategoryStats - Statistiques par catégorie
 */
export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionsCount: number;
}

/**
 * MemberStats - Statistiques par membre
 */
export interface MemberStats {
  memberId: number;
  memberName: string;
  memberAvatar?: string;
  memberColor: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionsCount: number;
}

/**
 * MonthlyStats - Statistiques mensuelles
 */
export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}
