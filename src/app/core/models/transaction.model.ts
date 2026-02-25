import { Category, CategoryType } from './category.model';
import { FamilyMember } from './family.model';

/**
 * Transaction - Transaction financière
 */
export interface Transaction {
  id?: number;
  familyId?: number;
  familyName?: string;
  categoryId: number;
  categoryName?: string;
  categoryIcon?: string;
  category?: Category; // Objet complet (optionnel)
  familyMemberId?: number;
  memberName?: string;
  familyMember?: FamilyMember; // Objet complet (optionnel)
  description: string;
  amount: number;
  type: CategoryType;
  date: string;
  notes?: string;
  recurring?: boolean;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * TransactionRequest - Données pour créer/modifier une transaction
 */
export interface TransactionRequest {
  categoryId: number;
  familyMemberId?: number; // Membre concerné
  description: string;
  amount: number;
  type: CategoryType;
  date: string;
  notes?: string;
  recurring?: boolean;
}

/**
 * PagedResponse - Réponse paginée générique de Spring Boot
 */
export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}
