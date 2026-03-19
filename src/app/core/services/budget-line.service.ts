import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetLine,
  BudgetLineRequest,
  BudgetLineWithDetails,
  BudgetLineStatus,
  BUDGET_LINE_LIMITS
} from '../models/budget-line.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetLineService {
  private apiUrl = `${environment.apiUrl}/families`;
  
  // Cache des lignes du budget actif
  private budgetLinesSubject = new BehaviorSubject<BudgetLine[]>([]);
  public budgetLines$ = this.budgetLinesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les lignes d'une catégorie dans un budget
   */
  getBudgetLinesByCategory(
    familyId: number,
    budgetId: number,
    categoryId: number
  ): Observable<BudgetLine[]> {
    return this.http.get<BudgetLine[]>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/by-category/${categoryId}`
    );
  }

  /**
   * Récupérer une ligne budgétaire avec tous ses détails
   */
  getBudgetLineWithDetails(
    familyId: number,
    budgetId: number,
    lineId: number
  ): Observable<BudgetLineWithDetails> {
    return this.http.get<BudgetLineWithDetails>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/${lineId}/details`
    );
  }

  /**
   * Créer une nouvelle ligne budgétaire
   */
  createBudgetLine(
    familyId: number,
    budgetId: number,
    categoryId: number,
    line: BudgetLineRequest
  ): Observable<BudgetLine> {
    return this.http.post<BudgetLine>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines`,
      { ...line, categoryId }
    ).pipe(
      tap(() => this.refreshBudgetLines(familyId, budgetId))
    );
  }

  /**
   * Créer plusieurs lignes budgétaires en une seule requête (BATCH)
   */
  createBudgetLinesBatch(
    familyId: number,
    budgetId: number,
    lines: Array<BudgetLineRequest & { categoryId: number }>
  ): Observable<BudgetLine[]> {
    return this.http.post<BudgetLine[]>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/batch`,
      { lines }
    ).pipe(
      tap(() => this.refreshBudgetLines(familyId, budgetId))
    );
  }

  /**
   * Mettre à jour une ligne budgétaire
   */
  updateBudgetLine(
    familyId: number,
    budgetId: number,
    lineId: number,
    line: BudgetLineRequest
  ): Observable<BudgetLine> {
    return this.http.put<BudgetLine>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/${lineId}`,
      line
    ).pipe(
      tap(() => this.refreshBudgetLines(familyId, budgetId))
    );
  }

  /**
   * Supprimer une ligne budgétaire
   */
  deleteBudgetLine(
    familyId: number,
    budgetId: number,
    lineId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/${lineId}`
    ).pipe(
      tap(() => this.refreshBudgetLines(familyId, budgetId))
    );
  }

  /**
   * Recalculer les montants effectifs d'une ligne (après modification de transactions)
   */
  recalculateBudgetLine(
    familyId: number,
    budgetId: number,
    lineId: number
  ): Observable<BudgetLine> {
    return this.http.post<BudgetLine>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/${lineId}/recalculate`,
      {}
    ).pipe(
      tap(() => this.refreshBudgetLines(familyId, budgetId))
    );
  }

  /**
   * Obtenir les lignes suggérées pour une transaction
   */
  suggestBudgetLines(
    familyId: number,
    budgetId: number,
    categoryId: number,
    transactionAmount: number,
    transactionDate: string
  ): Observable<BudgetLine[]> {
    const params = new HttpParams()
      .set('amount', transactionAmount.toString())
      .set('date', transactionDate);

    return this.http.get<BudgetLine[]>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines/by-category/${categoryId}/suggestions`,
      { params }
    );
  }

  /**
   * Vérifier si on peut ajouter une ligne à une catégorie
   */
  canAddLine(currentLineCount: number): boolean {
    return currentLineCount < BUDGET_LINE_LIMITS.MAX_LINES_PER_CATEGORY;
  }

  /**
   * Vérifier si on approche de la limite
   */
  isApproachingLimit(currentLineCount: number): boolean {
    return currentLineCount >= BUDGET_LINE_LIMITS.WARNING_THRESHOLD;
  }

  /**
   * Calculer le statut d'une ligne
   */
  calculateLineStatus(line: BudgetLine): BudgetLineStatus {
    if (line.actualAmount === 0) return BudgetLineStatus.EMPTY;

    const percentage = (line.actualAmount / line.plannedAmount) * 100;

    if (percentage > 100) return BudgetLineStatus.OVER;
    if (percentage === 100) return BudgetLineStatus.COMPLETED;
    if (percentage >= 80) return BudgetLineStatus.ON_TRACK;

    return BudgetLineStatus.PARTIAL;
  }

  /**
   * Obtenir la couleur CSS pour un statut
   */
  getStatusColor(status: BudgetLineStatus): string {
    const colors: Record<BudgetLineStatus, string> = {
      [BudgetLineStatus.EMPTY]: '#9e9e9e',
      [BudgetLineStatus.PARTIAL]: '#2196f3',
      [BudgetLineStatus.ON_TRACK]: '#8bc34a',
      [BudgetLineStatus.COMPLETED]: '#4caf50',
      [BudgetLineStatus.OVER]: '#f44336'
    };
    return colors[status];
  }

  /**
   * Obtenir l'icône pour un statut
   */
  getStatusIcon(status: BudgetLineStatus): string {
    const icons: Record<BudgetLineStatus, string> = {
      [BudgetLineStatus.EMPTY]: '⏳',
      [BudgetLineStatus.PARTIAL]: '🟡',
      [BudgetLineStatus.ON_TRACK]: '🟢',
      [BudgetLineStatus.COMPLETED]: '✅',
      [BudgetLineStatus.OVER]: '🔴'
    };
    return icons[status];
  }

  /**
   * Rafraîchir le cache des lignes
   */
  private refreshBudgetLines(familyId: number, budgetId: number): void {
    this.http.get<BudgetLine[]>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/lines`
    ).subscribe(lines => {
      this.budgetLinesSubject.next(lines);
    });
  }

  /**
   * Réinitialiser le cache
   */
  clearCache(): void {
    this.budgetLinesSubject.next([]);
  }
}
