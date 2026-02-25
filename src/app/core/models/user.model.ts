/**
 * User Model - Représente un utilisateur de l'application
 */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  active: boolean;
  emailVerified: boolean;
}

/**
 * AuthResponse - Réponse d'authentification avec token JWT
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * LoginRequest - Données de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * RegisterRequest - Données d'inscription
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
