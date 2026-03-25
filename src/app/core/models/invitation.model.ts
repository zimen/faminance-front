import { FamilyRole } from './family.model';

/**
 * InvitationStatus - États possibles d'une invitation
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

/**
 * Invitation - Invitation à rejoindre une famille
 */
export interface Invitation {
  id: number;
  familyId: number;
  familyName: string;
  email: string;
  token: string;
  proposedRole: FamilyRole;
  status: InvitationStatus;
  invitedBy: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * InvitationRequest - Données pour envoyer une invitation
 */
export interface InvitationRequest {
  familyId: number;
  email: string;
  proposedRole: FamilyRole;
  message?: string;
}

/**
 * InvitationPublicResponse - Réponse publique pour afficher une invitation (sans auth)
 */
export interface InvitationPublicResponse {
  familyId: number;
  familyName: string;
  familyDescription?: string;
  invitedBy: string;
  proposedRole: FamilyRole;
  message?: string;
  expiresAt: string;
  status: InvitationStatus;
}

/**
 * JoinByCodeRequest - Données pour rejoindre une famille par code
 */
export interface JoinByCodeRequest {
  joinCode: string;
}

/**
 * JoinByCodeResponse - Réponse après avoir rejoint par code
 * L'API retourne un objet Family complet avec tous les membres
 */
export interface JoinByCodeResponse {
  id: number;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  joinCode: string;
  memberCount: number;
  myRole: FamilyRole;
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    id: number;
    familyId: number;
    familyName: string;
    userId: number;
    username: string;
    userFullName: string;
    role: FamilyRole;
    nickname?: string;
    color?: string;
    active: boolean;
    createdAt: string;
  }>;
}
