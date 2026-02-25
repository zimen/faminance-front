/**
 * CategoryType - Type de catégorie (revenu ou dépense)
 */
export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

/**
 * Category - Catégorie de transaction
 */
export interface Category {
  id: number;
  familyId: number;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

/**
 * CategoryRequest - Données pour créer/modifier une catégorie
 */
export interface CategoryRequest {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  description?: string;
  displayOrder?: number;
}
