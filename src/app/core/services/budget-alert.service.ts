import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetAlert,
  BudgetAlertType,
  BudgetAlertLevel,
  BudgetAlertTrigger,
  BudgetNotificationRule,
  BudgetNotification
} from '../models/budget-alert.model';
import { BudgetLine } from '../models/budget-line.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetAlertService {
  private apiUrl = `${environment.apiUrl}/families`;
  
  // Alertes actives
  private activeAlertsSubject = new BehaviorSubject<BudgetAlert[]>([]);
  public activeAlerts$ = this.activeAlertsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Vérifier si une transaction va créer une alerte
   */
  checkTransactionAlert(
    budgetLine: BudgetLine,
    proposedAmount: number
  ): BudgetAlert | null {
    const newTotal = budgetLine.actualAmount + proposedAmount;
    const remaining = budgetLine.plannedAmount - newTotal;
    const percentageUsed = (newTotal / budgetLine.plannedAmount) * 100;

    // Cas 1 : Dépassement
    if (newTotal > budgetLine.plannedAmount) {
      return {
        type: BudgetAlertType.DANGER,
        level: BudgetAlertLevel.LINE,
        trigger: BudgetAlertTrigger.EXCEEDED,
        context: {
          lineId: budgetLine.id,
          lineName: budgetLine.label
        },
        amounts: {
          planned: budgetLine.plannedAmount,
          current: budgetLine.actualAmount,
          proposed: newTotal,
          remaining: 0,
          overrun: Math.abs(remaining),
          percentageUsed: percentageUsed
        },
        message: `Cette transaction dépassera le budget de "${budgetLine.label}" de ${Math.abs(remaining).toFixed(2)}€`,
        suggestions: [
          'Augmenter le budget prévu',
          'Rattacher à une autre ligne',
          'Continuer sans rattachement'
        ],
        severity: 'DANGER'
      };
    }

    // Cas 2 : Proche du budget (>80%)
    if (percentageUsed >= 80 && percentageUsed < 100) {
      return {
        type: BudgetAlertType.WARNING,
        level: BudgetAlertLevel.LINE,
        trigger: BudgetAlertTrigger.APPROACHING,
        context: {
          lineId: budgetLine.id,
          lineName: budgetLine.label
        },
        amounts: {
          planned: budgetLine.plannedAmount,
          current: budgetLine.actualAmount,
          proposed: newTotal,
          remaining: remaining,
          percentageUsed: percentageUsed
        },
        message: `Attention : Il ne restera que ${remaining.toFixed(2)}€ sur "${budgetLine.label}" (${percentageUsed.toFixed(0)}% utilisé)`,
        suggestions: [
          'Vérifier les prochaines dépenses prévues'
        ],
        severity: 'WARNING'
      };
    }

    // Cas 3 : Presque épuisé (>95%)
    if (percentageUsed >= 95 && percentageUsed < 100) {
      return {
        type: BudgetAlertType.WARNING,
        level: BudgetAlertLevel.LINE,
        trigger: BudgetAlertTrigger.DEPLETED,
        context: {
          lineId: budgetLine.id,
          lineName: budgetLine.label
        },
        amounts: {
          planned: budgetLine.plannedAmount,
          current: budgetLine.actualAmount,
          proposed: newTotal,
          remaining: remaining,
          percentageUsed: percentageUsed
        },
        message: `Budget presque épuisé : seulement ${remaining.toFixed(2)}€ restant sur "${budgetLine.label}"`,
        severity: 'WARNING'
      };
    }

    return null;
  }

  /**
   * Récupérer les règles de notification
   */
  getNotificationRules(familyId: number): Observable<BudgetNotificationRule[]> {
    return this.http.get<BudgetNotificationRule[]>(
      `${this.apiUrl}/${familyId}/budget-notifications/rules`
    );
  }

  /**
   * Créer une règle de notification
   */
  createNotificationRule(
    familyId: number,
    rule: Partial<BudgetNotificationRule>
  ): Observable<BudgetNotificationRule> {
    return this.http.post<BudgetNotificationRule>(
      `${this.apiUrl}/${familyId}/budget-notifications/rules`,
      rule
    );
  }

  /**
   * Mettre à jour une règle de notification
   */
  updateNotificationRule(
    familyId: number,
    ruleId: number,
    rule: Partial<BudgetNotificationRule>
  ): Observable<BudgetNotificationRule> {
    return this.http.put<BudgetNotificationRule>(
      `${this.apiUrl}/${familyId}/budget-notifications/rules/${ruleId}`,
      rule
    );
  }

  /**
   * Supprimer une règle de notification
   */
  deleteNotificationRule(familyId: number, ruleId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${familyId}/budget-notifications/rules/${ruleId}`
    );
  }

  /**
   * Récupérer les notifications
   */
  getNotifications(
    familyId: number,
    unreadOnly: boolean = false
  ): Observable<BudgetNotification[]> {
    const url = unreadOnly
      ? `${this.apiUrl}/${familyId}/budget-notifications?unread=true`
      : `${this.apiUrl}/${familyId}/budget-notifications`;
    
    return this.http.get<BudgetNotification[]>(url);
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(familyId: number, notificationId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${familyId}/budget-notifications/${notificationId}/read`,
      {}
    );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(familyId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${familyId}/budget-notifications/read-all`,
      {}
    );
  }

  /**
   * Ajouter une alerte active
   */
  addAlert(alert: BudgetAlert): void {
    const currentAlerts = this.activeAlertsSubject.value;
    this.activeAlertsSubject.next([...currentAlerts, alert]);
  }

  /**
   * Supprimer une alerte active
   */
  removeAlert(alert: BudgetAlert): void {
    const currentAlerts = this.activeAlertsSubject.value;
    const filtered = currentAlerts.filter(a => 
      a.context.lineId !== alert.context.lineId
    );
    this.activeAlertsSubject.next(filtered);
  }

  /**
   * Effacer toutes les alertes
   */
  clearAlerts(): void {
    this.activeAlertsSubject.next([]);
  }

  /**
   * Obtenir le nombre d'alertes actives
   */
  getAlertCount(): number {
    return this.activeAlertsSubject.value.length;
  }
}
