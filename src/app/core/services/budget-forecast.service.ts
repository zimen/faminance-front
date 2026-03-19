import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MonthEndForecast,
  BudgetOptimizationSuggestion,
  BudgetComparison,
  RecurrenceDetection
} from '../models/budget-forecast.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetForecastService {
  private apiUrl = `${environment.apiUrl}/families`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les prévisions de fin de mois
   */
  getMonthEndForecast(
    familyId: number,
    budgetId: number
  ): Observable<MonthEndForecast> {
    return this.http.get<MonthEndForecast>(
      `${this.apiUrl}/${familyId}/budgets/${budgetId}/forecast`
    );
  }

  /**
   * Obtenir les suggestions d'optimisation du template
   */
  getOptimizationSuggestions(
    familyId: number,
    templateId: number,
    monthsToAnalyze: number = 6
  ): Observable<BudgetOptimizationSuggestion[]> {
    const params = new HttpParams().set('months', monthsToAnalyze.toString());
    
    return this.http.get<BudgetOptimizationSuggestion[]>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}/suggestions`,
      { params }
    );
  }

  /**
   * Comparer les budgets sur plusieurs mois
   */
  compareBudgets(
    familyId: number,
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ): Observable<BudgetComparison> {
    const params = new HttpParams()
      .set('fromMonth', fromMonth.toString())
      .set('fromYear', fromYear.toString())
      .set('toMonth', toMonth.toString())
      .set('toYear', toYear.toString());
    
    return this.http.get<BudgetComparison>(
      `${this.apiUrl}/${familyId}/budgets/compare`,
      { params }
    );
  }

  /**
   * Détecter les récurrences dans les transactions
   */
  detectRecurrence(
    familyId: number,
    lineLabel: string,
    monthsToAnalyze: number = 6
  ): Observable<RecurrenceDetection> {
    const params = new HttpParams()
      .set('lineLabel', lineLabel)
      .set('months', monthsToAnalyze.toString());
    
    return this.http.get<RecurrenceDetection>(
      `${this.apiUrl}/${familyId}/budgets/detect-recurrence`,
      { params }
    );
  }

  /**
   * Calculer la projection linéaire simple
   */
  calculateLinearProjection(
    currentAmount: number,
    daysElapsed: number,
    totalDays: number
  ): number {
    if (daysElapsed === 0) return 0;
    return (currentAmount / daysElapsed) * totalDays;
  }

  /**
   * Calculer le niveau de risque
   */
  calculateRiskLevel(
    projected: number,
    planned: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const variance = ((projected - planned) / planned) * 100;
    
    if (variance > 20) return 'HIGH';
    if (variance > 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Formater une suggestion de modification
   */
  formatOptimizationMessage(suggestion: BudgetOptimizationSuggestion): string {
    const { current, suggestion: sug } = suggestion;
    const diff = sug.newPlanned - current.planned;
    const action = diff > 0 ? 'Augmenter' : 'Réduire';
    const amount = Math.abs(diff);
    
    return `${action} de ${amount.toFixed(2)}€ (${current.usagePercentage.toFixed(0)}% utilisé en moyenne)`;
  }

  /**
   * Calculer la tendance
   */
  calculateTrend(
    values: number[]
  ): { trend: 'INCREASING' | 'DECREASING' | 'STABLE'; change: number } {
    if (values.length < 2) {
      return { trend: 'STABLE', change: 0 };
    }

    const last = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = ((last - previous) / previous) * 100;

    if (Math.abs(change) < 5) {
      return { trend: 'STABLE', change };
    }

    return {
      trend: change > 0 ? 'INCREASING' : 'DECREASING',
      change
    };
  }
}
