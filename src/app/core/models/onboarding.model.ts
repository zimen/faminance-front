import { TransactionRequest } from './transaction.model';

/**
 * OnboardingStep - Étape du processus d'onboarding
 */
export interface OnboardingStep {
  step: number;
  name: string;
  completed: boolean;
  optional: boolean;
}

/**
 * OnboardingState - État complet du processus d'onboarding
 */
export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  userData?: {
    email: string;
    password: string;
  };
  familyData?: {
    firstName: string;
    familyName: string;
    nickname?: string;
  };
  selectedCategoryIds?: number[];
  firstTransaction?: TransactionRequest;
}

/**
 * OnboardingProgress - Progression de l'utilisateur
 */
export interface OnboardingProgress {
  accountCreated: boolean;
  familyCreated: boolean;
  categoriesConfigured: number;
  firstTransactionAdded: boolean;
  membersInvited: number;
  budgetsSet: boolean;
  revenuesAdded: boolean;
}

/**
 * FamilyQuickSetupRequest - Création rapide famille + membre
 */
export interface FamilyQuickSetupRequest {
  familyName: string;
  userFirstName: string;
  userNickname?: string;
}

/**
 * FamilyQuickSetupResponse - Résultat de la création rapide
 */
export interface FamilyQuickSetupResponse {
  family: any; // Family type
  member: any; // FamilyMember type
}

/**
 * OnboardingStatus - Statut d'onboarding récupéré depuis le backend
 * Permet de synchroniser l'état entre le local et le serveur
 */
export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  stepsCompleted: {
    accountCreated: boolean;
    familyCreated: boolean;
    categoriesAdded: boolean;
    firstTransactionAdded: boolean;
  };
  completedAt?: string; // Date de complétion ISO
}
