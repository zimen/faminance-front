import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BudgetTemplate,
  BudgetTemplateRequest,
  BudgetComparisonReport,
  BudgetTemplateSuggestion,
  Budget
} from '../models/budget-template.model';
import { environment } from '../../../environments/environment';

/**
 * Service Angular pour la gestion des modèles de budget
 */
@Injectable({
  providedIn: 'root'
})
export class BudgetTemplateService {
  private apiUrl = `${environment.apiUrl}/families`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les modèles d'une famille
   */
  getTemplates(familyId: number): Observable<BudgetTemplate[]> {
    return this.http.get<BudgetTemplate[]>(
      `${this.apiUrl}/${familyId}/budget-templates`
    );
  }

  /**
   * Récupère un modèle par son ID
   */
  getTemplateById(familyId: number, templateId: number): Observable<BudgetTemplate> {
    return this.http.get<BudgetTemplate>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}`
    );
  }

  /**
   * Récupère le modèle par défaut d'une famille
   */
  getDefaultTemplate(familyId: number): Observable<BudgetTemplate> {
    return this.http.get<BudgetTemplate>(
      `${this.apiUrl}/${familyId}/budget-templates/default`
    );
  }

  /**
   * Crée un nouveau modèle de budget
   */
  createTemplate(
    familyId: number,
    request: BudgetTemplateRequest
  ): Observable<BudgetTemplate> {
    return this.http.post<BudgetTemplate>(
      `${this.apiUrl}/${familyId}/budget-templates`,
      request
    );
  }

  /**
   * Met à jour un modèle existant
   */
  updateTemplate(
    familyId: number,
    templateId: number,
    request: BudgetTemplateRequest
  ): Observable<BudgetTemplate> {
    return this.http.put<BudgetTemplate>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}`,
      request
    );
  }

  /**
   * Supprime un modèle
   */
  deleteTemplate(familyId: number, templateId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}`
    );
  }

  /**
   * Applique un modèle pour créer les budgets d'un mois
   */
  applyTemplate(
    familyId: number,
    templateId: number,
    month: number,
    year: number
  ): Observable<Budget[]> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.post<Budget[]>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}/apply`,
      null,
      { params }
    );
  }

  /**
   * Compare un modèle avec les dépenses réelles d'un mois
   */
  compareWithActual(
    familyId: number,
    templateId: number,
    month: number,
    year: number
  ): Observable<BudgetComparisonReport> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<BudgetComparisonReport>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}/compare`,
      { params }
    );
  }

  /**
   * Obtient des suggestions d'ajustement basées sur l'historique
   */
  getSuggestions(
    familyId: number,
    templateId: number
  ): Observable<BudgetTemplateSuggestion> {
    return this.http.get<BudgetTemplateSuggestion>(
      `${this.apiUrl}/${familyId}/budget-templates/${templateId}/suggestions`
    );
  }
}
