import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Invitation, InvitationRequest } from '../models';
import { environment } from '../../../environments/environment';

/**
 * InvitationService - Gestion des invitations
 * Permet d'inviter des utilisateurs à rejoindre une famille
 */
@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly API_URL = `${environment.apiUrl}/invitations`;

  constructor(private http: HttpClient) {}

  /**
   * Envoie une invitation pour rejoindre une famille
   * Nécessite le rôle ADMIN ou PARENT
   */
  sendInvitation(request: InvitationRequest): Observable<Invitation> {
    return this.http.post<Invitation>(this.API_URL, request)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de l\'envoi de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère toutes les invitations reçues par l'utilisateur connecté
   */
  getMyInvitations(): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(this.API_URL)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des invitations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère toutes les invitations envoyées par l'utilisateur ou sa famille
   */
  getSentInvitations(familyId?: number): Observable<Invitation[]> {
    const url = familyId 
      ? `${this.API_URL}/sent?familyId=${familyId}`
      : `${this.API_URL}/sent`;
    
    return this.http.get<Invitation[]>(url)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des invitations envoyées:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère les invitations d'une famille spécifique
   */
  getFamilyInvitations(familyId: number): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${environment.apiUrl}/families/${familyId}/invitations`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des invitations de la famille ${familyId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupère une invitation par son token
   */
  getInvitationByToken(token: string): Observable<Invitation> {
    return this.http.get<Invitation>(`${this.API_URL}/token/${token}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Accepte une invitation
   */
  acceptInvitation(token: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${token}/accept`, {})
      .pipe(
        catchError(error => {
          console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Refuse une invitation
   */
  declineInvitation(token: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${token}/decline`, {})
      .pipe(
        catchError(error => {
          console.error('Erreur lors du refus de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Annule une invitation (par l'envoyeur)
   * Nécessite le rôle ADMIN ou PARENT
   */
  cancelInvitation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de l\'annulation de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Renvoie une invitation expirée
   */
  resendInvitation(id: number): Observable<Invitation> {
    return this.http.post<Invitation>(`${this.API_URL}/${id}/resend`, {})
      .pipe(
        catchError(error => {
          console.error('Erreur lors du renvoi de l\'invitation:', error);
          return throwError(() => error);
        })
      );
  }
}
