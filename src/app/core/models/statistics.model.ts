export interface CategoryStatistics {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export interface MonthlyStatistics {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: CategoryStatistics[];
  expenseByCategory: CategoryStatistics[];
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
