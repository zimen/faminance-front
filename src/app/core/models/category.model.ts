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
  isSystemCategory?: boolean; // true si créée depuis une catégorie système
  systemCategoryId?: number; // ID de la catégorie système source
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
  systemCategoryId?: number; // Pour créer depuis une catégorie système
}

/**
 * SystemCategory - Catégorie prédéfinie du système
 */
export interface SystemCategory {
  id: number;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  description?: string;
  tags?: string[];
  usageCount?: number; // Nombre de familles utilisant cette catégorie
  recommended?: boolean; // true si catégorie recommandée
}
