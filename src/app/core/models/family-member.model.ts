export interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'PARENT' | 'CHILD';
  joinedAt?: Date;
  userId: number;
  familyId: number;
}
