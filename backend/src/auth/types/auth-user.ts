import type { Request } from 'express';
import type { Role } from '../../generated/prisma/enums.js';

/** Usuario autenticado que JwtStrategy deja en `req.user`. */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}

/** Perfil que GoogleStrategy deja en `req.user` durante el callback. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
}

export type AuthenticatedRequest = Request & { user: AuthUser };
export type GoogleRequest = Request & { user: GoogleProfile };
