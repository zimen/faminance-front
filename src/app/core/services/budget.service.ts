import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Budget, BudgetRequest } from '../models';
import { environment } from '../../../environments/environment';

/**
 * BudgetService - Gestion des budgets
 * Les budgets sont gérés par ADMIN et PARENT uniquement
 */
@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les budgets d'une famille
   */
  getBudgets(familyId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.API_URL}/families/${familyId}/budgets`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des budgets:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère les budgets actifs d'une famille
   */
  getActiveBudgets(familyId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.API_URL}/families/${familyId}/budgets/active`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des budgets actifs:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère un budget par son ID
   */
  getBudgetById(familyId: number, budgetId: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.API_URL}/families/${familyId}/budgets/${budgetId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération du budget ${budgetId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère le budget d'une catégorie spécifique
   */
  getBudgetByCategory(familyId: number, categoryId: number): Observable<Budget | null> {
    return this.http.get<Budget | null>(
      `${this.API_URL}/families/${familyId}/budgets/category/${categoryId}`
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération du budget de la catégorie ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crée un nouveau budget
   * Nécessite le rôle ADMIN ou PARENT
   */
  createBudget(familyId: number, request: BudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(`${this.API_URL}/families/${familyId}/budgets`, request)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création du budget:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Met à jour un budget
   * Nécessite le rôle ADMIN ou PARENT
   */
  updateBudget(familyId: number, budgetId: number, request: BudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(
      `${this.API_URL}/families/${familyId}/budgets/${budgetId}`,
      request
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la mise à jour du budget ${budgetId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprime un budget
   * Nécessite le rôle ADMIN ou PARENT
   */
  deleteBudget(familyId: number, budgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/families/${familyId}/budgets/${budgetId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression du budget ${budgetId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Active/désactive un budget
   */
  toggleBudgetStatus(familyId: number, budgetId: number, active: boolean): Observable<Budget> {
    return this.http.patch<Budget>(
      `${this.API_URL}/families/${familyId}/budgets/${budgetId}/status`,
      { active }
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors du changement de statut du budget ${budgetId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère le statut de tous les budgets (dépassement, proche de la limite, etc.)
   */
  getBudgetsStatus(familyId: number): Observable<{
    total: number;
    exceeded: number;
    warning: number;
    healthy: number;
  }> {
    return this.http.get<{
      total: number;
      exceeded: number;
      warning: number;
      healthy: number;
    }>(`${this.API_URL}/families/${familyId}/budgets/status`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du statut des budgets:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère les budgets par mois et année (compatibilité avec l'ancienne API)
   */
  getBudgetsByMonthAndYear(familyId: number, month: number, year: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(
      `${this.API_URL}/families/${familyId}/budgets?month=${month}&year=${year}`
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des budgets par mois/année:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Recalcule les budgets pour un mois donné (compatibilité avec l'ancienne API)
   */
  recalculateBudgets(familyId: number, month: number, year: number): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/families/${familyId}/budgets/recalculate?month=${month}&year=${year}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du recalcul des budgets:', error);
        return throwError(() => error);
      })
    );
  }
}
