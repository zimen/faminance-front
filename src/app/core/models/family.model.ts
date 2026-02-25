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
}

/**
 * FamilyMember - Membre d'une famille avec son rôle
 */
export interface FamilyMember {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  nickname?: string;
  avatarUrl?: string;
  role: FamilyRole;
  color: string;
  active: boolean;
}

/**
 * FamilyRequest - Données pour créer/modifier une famille
 */
export interface FamilyRequest {
  name: string;
  description?: string;
  color?: string;
}
