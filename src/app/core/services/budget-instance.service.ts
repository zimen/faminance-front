import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetInstance,
  BudgetInstanceRequest,
  BudgetCategoryInstance
} from '../models/budget-template.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetInstanceService {
  private apiUrl = `${environment.apiUrl}/families`;
  
  // Budget actif (mois en cours)
  private activeBudgetSubject = new BehaviorSubject<BudgetInstance | null>(null);
  public activeBudget$ = this.activeBudgetSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupérer le budget actif (mois en cours)
   */
  getActiveBudget(familyId: number): Observable<BudgetInstance> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    return this.http.get<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/active`,
      { params: new HttpParams()
          .set('month', month)
          .set('year', year)
          .set('groupByCategory', 'true') }
    ).pipe(
      tap(budget => this.activeBudgetSubject.next(budget))
    );
  }

  /**
   * Récupérer un budget par mois/année
   */
  getBudgetByMonth(
    familyId: number,
    month: number,
    year: number
  ): Observable<BudgetInstance> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('groupByCategory', 'true');
    
    return this.http.get<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/by-month`,
      { params }
    );
  }

  /**
   * Récupérer un budget par ID
   */
  getBudgetById(familyId: number, budgetId: number): Observable<BudgetInstance> {
    const params = new HttpParams().set('groupByCategory', 'true');
    
    return this.http.get<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}`,
      { params }
    );
  }

  /**
   * Lister tous les budgets d'une famille
   */
  listBudgets(
    familyId: number,
    fromMonth?: number,
    fromYear?: number,
    toMonth?: number,
    toYear?: number
  ): Observable<BudgetInstance[]> {
    let params = new HttpParams();
    if (fromMonth) params = params.set('fromMonth', fromMonth.toString());
    if (fromYear) params = params.set('fromYear', fromYear.toString());
    if (toMonth) params = params.set('toMonth', toMonth.toString());
    if (toYear) params = params.set('toYear', toYear.toString());
    
    return this.http.get<BudgetInstance[]>(
      `${this.apiUrl}/${familyId}/budget-instances`,
      { params }
    );
  }

  /**
   * Créer un budget manuellement
   */
  createBudget(
    familyId: number,
    budget: BudgetInstanceRequest
  ): Observable<BudgetInstance> {
    return this.http.post<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances`,
      budget
    ).pipe(
      tap(created => {
        // Si c'est le mois actif, mettre à jour le cache
        const now = new Date();
        if (created.month === now.getMonth() + 1 && created.year === now.getFullYear()) {
          this.activeBudgetSubject.next(created);
        }
      })
    );
  }

  /**
   * Générer un budget depuis un template
   */
  generateFromTemplate(
    familyId: number,
    templateId: number,
    month: number,
    year: number
  ): Observable<BudgetInstance> {
    return this.http.post<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/generate`,
      { templateId, month, year }
    ).pipe(
      tap(created => {
        const now = new Date();
        if (created.month === now.getMonth() + 1 && created.year === now.getFullYear()) {
          this.activeBudgetSubject.next(created);
        }
      })
    );
  }

  /**
   * Mettre à jour un budget
   */
  updateBudget(
    familyId: number,
    budgetId: number,
    budget: Partial<BudgetInstanceRequest>
  ): Observable<BudgetInstance> {
    return this.http.put<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}`,
      budget
    ).pipe(
      tap(updated => {
        const currentActive = this.activeBudgetSubject.value;
        if (currentActive && currentActive.id === updated.id) {
          this.activeBudgetSubject.next(updated);
        }
      })
    );
  }

  /**
   * Supprimer un budget
   */
  deleteBudget(familyId: number, budgetId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}`
    ).pipe(
      tap(() => {
        const currentActive = this.activeBudgetSubject.value;
        if (currentActive && currentActive.id === budgetId) {
          this.activeBudgetSubject.next(null);
        }
      })
    );
  }

  /**
   * Recalculer tous les totaux d'un budget
   */
  recalculateBudget(
    familyId: number,
    budgetId: number
  ): Observable<BudgetInstance> {
    return this.http.post<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/recalculate`,
      {}
    ).pipe(
      tap(updated => {
        const currentActive = this.activeBudgetSubject.value;
        if (currentActive && currentActive.id === updated.id) {
          this.activeBudgetSubject.next(updated);
        }
      })
    );
  }

  /**
   * Copier un budget vers un autre mois
   */
  copyBudget(
    familyId: number,
    budgetId: number,
    toMonth: number,
    toYear: number
  ): Observable<BudgetInstance> {
    return this.http.post<BudgetInstance>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/copy`,
      { month: toMonth, year: toYear }
    );
  }

  /**
   * Obtenir les catégories d'un budget
   */
  getBudgetCategories(
    familyId: number,
    budgetId: number
  ): Observable<BudgetCategoryInstance[]> {
    return this.http.get<BudgetCategoryInstance[]>(
      `${this.apiUrl}/${familyId}/budget-instances/${budgetId}/categories`
    );
  }

  /**
   * Obtenir le budget actif en cache (synchrone)
   */
  getActiveBudgetSync(): BudgetInstance | null {
    return this.activeBudgetSubject.value;
  }

  /**
   * Vérifier si un budget existe pour un mois donné
   */
  budgetExists(
    familyId: number,
    month: number,
    year: number
  ): Observable<boolean> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());
    
    return this.http.get<boolean>(
      `${this.apiUrl}/${familyId}/budget-instances/exists`,
      { params }
    );
  }

  /**
   * Rafraîchir le budget actif
   */
  refreshActiveBudget(familyId: number): Observable<BudgetInstance> {
    return this.getActiveBudget(familyId);
  }

  /**
   * Effacer le cache
   */
  clearCache(): void {
    this.activeBudgetSubject.next(null);
  }
}
