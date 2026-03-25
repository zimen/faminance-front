/**
 * FamilyRole - Rôles possibles dans une famille
 */
export enum FamilyRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  MEMBER = 'MEMBER'
}

/**
 * Family - Représente une famille
 */
export interface Family {
  id: number;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  membersCount: number;
  myRole: FamilyRole;
  createdAt: string;
  currency?: string;
  joinCode?: string; // Code court pour rejoindre la famille (ex: AB12-XY34)
}

/**
 * FamilyMember - Membre d'une famille avec son rôle
 */
export interface FamilyMember {
  id: number;
  familyId: number;
  familyName: string;
  userId: number;
  username: string;
  userFullName: string;
  role: FamilyRole;
  nickname?: string;
  color?: string | null;
  active: boolean;
  createdAt: string;
}

/**
 * FamilyRequest - Données pour créer/modifier une famille
 */
export interface FamilyRequest {
  name: string;
  description?: string;
  color?: string;
}
