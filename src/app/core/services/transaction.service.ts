import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Transaction, TransactionRequest, PagedResponse } from '../models/transaction.model';
import { CategoryType } from '../models/category.model';
import { environment } from '../../../environments/environment';

/**
 * TransactionService - Gestion des transactions
 * Chaque transaction est liée à une famille et à un membre
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les transactions d'une famille
   */
  getTransactions(
    familyId: number, 
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: CategoryType;
      categoryId?: number;
      memberId?: number;
    }
  ): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
      if (filters.memberId) params = params.set('memberId', filters.memberId.toString());
    }

    return this.http.get<PagedResponse<Transaction>>(`${this.API_URL}/families/${familyId}/transactions`, { params })
      .pipe(
        map(response => response.content),
        catchError(error => {
          console.error('Erreur lors de la récupération des transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère une transaction par son ID
   */
  getTransactionById(familyId: number, transactionId: number): Observable<Transaction> {
    return this.http.get<Transaction>(
      `${this.API_URL}/families/${familyId}/transactions/${transactionId}`
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération de la transaction ${transactionId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les transactions d'un membre spécifique
   */
  getTransactionsByMember(familyId: number, memberId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.API_URL}/families/${familyId}/transactions/member/${memberId}`
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des transactions du membre ${memberId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les transactions d'une catégorie spécifique
   */
  getTransactionsByCategory(familyId: number, categoryId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.API_URL}/families/${familyId}/transactions/category/${categoryId}`
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des transactions de la catégorie ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crée une nouvelle transaction
   */
  createTransaction(familyId: number, request: TransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.API_URL}/families/${familyId}/transactions`,
      request
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la création de la transaction:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Met à jour une transaction
   */
  updateTransaction(
    familyId: number,
    transactionId: number,
    request: TransactionRequest
  ): Observable<Transaction> {
    return this.http.put<Transaction>(
      `${this.API_URL}/families/${familyId}/transactions/${transactionId}`,
      request
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la mise à jour de la transaction ${transactionId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprime une transaction
   * Les membres peuvent supprimer leurs propres transactions
   * ADMIN et PARENT peuvent supprimer toutes les transactions
   */
  deleteTransaction(familyId: number, transactionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/families/${familyId}/transactions/${transactionId}`
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la suppression de la transaction ${transactionId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les transactions récurrentes d'une famille
   */
  getRecurringTransactions(familyId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.API_URL}/families/${familyId}/transactions/recurring`
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des transactions récurrentes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Duplique une transaction
   */
  duplicateTransaction(familyId: number, transactionId: number): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.API_URL}/families/${familyId}/transactions/${transactionId}/duplicate`,
      {}
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la duplication de la transaction ${transactionId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les transactions par mois et année (compatibilité avec l'ancienne API)
   */
  getTransactionsByMonthAndYear(familyId: number, month: number, year: number): Observable<Transaction[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.getTransactions(familyId, { startDate, endDate });
  }

  /**
   * Récupère les transactions par type (compatibilité avec l'ancienne API)
   */
  getTransactionsByType(familyId: number, type: CategoryType): Observable<Transaction[]> {
    return this.getTransactions(familyId, { type });
  }

  /**
   * Récupère le total par mois, année et type (compatibilité avec l'ancienne API)
   */
  getTotalByMonthAndYearAndType(familyId: number, month: number, year: number, type: CategoryType): Observable<number> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return this.http.get<number>(
      `${this.API_URL}/families/${familyId}/transactions/total?startDate=${startDate}&endDate=${endDate}&type=${type}`
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du calcul du total:', error);
        return throwError(() => error);
      })
    );
  }
}
