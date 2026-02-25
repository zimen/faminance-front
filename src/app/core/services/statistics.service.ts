import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Statistics } from '../models';
import { environment } from '../../../environments/environment';

/**
 * StatisticsService - Gestion des statistiques
 * Fournit des analyses et rapports pour une famille
 */
@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques globales d'une famille
   */
  getStatistics(
    familyId: number,
    startDate?: string,
    endDate?: string
  ): Observable<Statistics> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<Statistics>(
      `${this.API_URL}/families/${familyId}/statistics`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les statistiques pour le mois en cours
   */
  getCurrentMonthStatistics(familyId: number): Observable<Statistics> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    return this.getStatistics(familyId, startDate, endDate);
  }

  /**
   * Récupère les statistiques pour l'année en cours
   */
  getYearlyStatistics(familyId: number): Observable<Statistics> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    
    return this.getStatistics(familyId, startDate, endDate);
  }

  /**
   * Récupère les statistiques d'un membre spécifique
   */
  getMemberStatistics(
    familyId: number,
    memberId: number,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(
      `${this.API_URL}/families/${familyId}/statistics/member/${memberId}`,
      { params }
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des statistiques du membre ${memberId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les statistiques d'une catégorie spécifique
   */
  getCategoryStatistics(
    familyId: number,
    categoryId: number,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(
      `${this.API_URL}/families/${familyId}/statistics/category/${categoryId}`,
      { params }
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la récupération des statistiques de la catégorie ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Export des données en CSV
   */
  exportToCSV(
    familyId: number,
    startDate?: string,
    endDate?: string
  ): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(
      `${this.API_URL}/families/${familyId}/statistics/export/csv`,
      { params, responseType: 'blob' }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'export CSV:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Comparaison entre deux périodes
   */
  comparePeriods(
    familyId: number,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('period1Start', period1Start)
      .set('period1End', period1End)
      .set('period2Start', period2Start)
      .set('period2End', period2End);

    return this.http.get(
      `${this.API_URL}/families/${familyId}/statistics/compare`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la comparaison des périodes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les statistiques mensuelles (compatibilité avec l'ancienne API)
   */
  getMonthlyStatistics(familyId: number, month: number, year: number): Observable<any> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.getStatistics(familyId, startDate, endDate);
  }
}
