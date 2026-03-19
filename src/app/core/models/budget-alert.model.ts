/**
 * Modèles pour le système d'alertes budgétaires
 */

/**
 * BudgetAlert - Alerte budgétaire en temps réel
 */
export interface BudgetAlert {
  type: BudgetAlertType;
  level: BudgetAlertLevel;
  trigger: BudgetAlertTrigger;
  
  context: {
    lineId?: number;
    lineName?: string;
    categoryId?: number;
    categoryName?: string;
    budgetId?: number;
    budgetName?: string;
  };
  
  amounts: {
    planned: number;
    current: number;
    proposed: number;  // Après la transaction en cours
    remaining: number;
    overrun?: number;
    percentageUsed: number;
  };
  
  message: string;
  suggestions?: string[];
  severity: 'INFO' | 'WARNING' | 'DANGER';
}

export enum BudgetAlertType {
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  INFO = 'INFO'
}

export enum BudgetAlertLevel {
  LINE = 'LINE',
  CATEGORY = 'CATEGORY',
  BUDGET = 'BUDGET'
}

export enum BudgetAlertTrigger {
  APPROACHING = 'APPROACHING',  // Proche du budget (>80%)
  EXCEEDED = 'EXCEEDED',        // Dépassé
  DEPLETED = 'DEPLETED'        // Épuisé (>95%)
}

/**
 * BudgetNotificationRule - Règle de notification
 */
export interface BudgetNotificationRule {
  id: number;
  familyId: number;
  enabled: boolean;
  
  // Déclencheur
  triggerType: 'PERCENTAGE' | 'ABSOLUTE_REMAINING' | 'OVERRUN';
  threshold: number;
  
  // Niveau
  scope: 'LINE' | 'CATEGORY' | 'BUDGET';
  
  // Notification
  channels: NotificationChannel[];
  recipientMemberIds: number[];
  
  // Message personnalisé
  customMessage?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

/**
 * BudgetNotification - Notification envoyée
 */
export interface BudgetNotification {
  id: number;
  familyId: number;
  ruleId?: number;
  
  type: BudgetAlertType;
  title: string;
  message: string;
  
  relatedBudgetLineId?: number;
  relatedCategoryId?: number;
  relatedBudgetId?: number;
  
  read: boolean;
  sentAt: string;
  readAt?: string;
}

/**
 * Règles de notification par défaut
 */
export const DEFAULT_NOTIFICATION_RULES: Partial<BudgetNotificationRule>[] = [
  {
    enabled: true,
    triggerType: 'PERCENTAGE',
    threshold: 80,
    scope: 'LINE',
    channels: ['IN_APP']
  },
  {
    enabled: true,
    triggerType: 'OVERRUN',
    threshold: 0,
    scope: 'CATEGORY',
    channels: ['IN_APP', 'EMAIL']
  }
];
