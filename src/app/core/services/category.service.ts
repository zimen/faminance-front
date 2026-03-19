import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Category, CategoryRequest, SystemCategory } from '../models';
import { environment } from '../../../environments/environment';

/**
 * CategoryService - Gestion des catégories
 * Les catégories sont liées à une famille et partagées entre tous les membres
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les catégories d'une famille
   */
  getCategories(familyId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/families/${familyId}/categories`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des catégories:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère une catégorie par son ID
   */
  getCategoryById(familyId: number, categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.API_URL}/families/${familyId}/categories/${categoryId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de la catégorie ${categoryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crée une nouvelle catégorie
   * Nécessite le rôle ADMIN ou PARENT
   */
  createCategory(familyId: number, request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.API_URL}/families/${familyId}/categories`, request)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création de la catégorie:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Met à jour une catégorie
   * Nécessite le rôle ADMIN ou PARENT
   */
  updateCategory(familyId: number, categoryId: number, request: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(
      `${this.API_URL}/families/${familyId}/categories/${categoryId}`,
      request
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors de la mise à jour de la catégorie ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprime une catégorie
   * Nécessite le rôle ADMIN ou PARENT
   */
  deleteCategory(familyId: number, categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/families/${familyId}/categories/${categoryId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression de la catégorie ${categoryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Active/désactive une catégorie
   */
  toggleCategoryStatus(familyId: number, categoryId: number, active: boolean): Observable<Category> {
    return this.http.patch<Category>(
      `${this.API_URL}/families/${familyId}/categories/${categoryId}/status`,
      { active }
    ).pipe(
      catchError(error => {
        console.error(`Erreur lors du changement de statut de la catégorie ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère toutes les catégories système disponibles
   */
  getSystemCategories(): Observable<SystemCategory[]> {
    return this.http.get<SystemCategory[]>(`${this.API_URL}/system-categories`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des catégories système:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère les catégories système recommandées
   */
  getRecommendedSystemCategories(): Observable<SystemCategory[]> {
    return this.http.get<SystemCategory[]>(`${this.API_URL}/system-categories/recommended`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des catégories recommandées:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Ajoute une catégorie système à la famille
   * Crée une copie de la catégorie système pour la famille
   */
  addSystemCategoryToFamily(familyId: number, systemCategory: SystemCategory): Observable<Category> {
    const request: CategoryRequest = {
      name: systemCategory.name,
      type: systemCategory.defaultType,
      icon: systemCategory.icon,
      color: systemCategory.defaultColor,
      description: systemCategory.description,
      systemCategoryId: systemCategory.id
    };
    
    return this.http.post<Category>(
      `${this.API_URL}/families/${familyId}/categories`,
      request
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ajout de la catégorie système:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ajoute plusieurs catégories système à la famille en une seule requête
   * Utilisé lors de l'onboarding pour ajouter rapidement les catégories recommandées
   */
  addMultipleSystemCategories(familyId: number, systemCategoryIds: number[]): Observable<Category[]> {
    return this.http.post<Category[]>(
      `${this.API_URL}/families/${familyId}/categories/bulk`,
      { systemCategoryIds }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ajout multiple de catégories système:', error);
        return throwError(() => error);
      })
    );
  }
}
