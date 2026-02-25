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
