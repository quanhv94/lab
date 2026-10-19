import { Request } from 'express';
import { Role } from '../common/roles';

export { Role } from '../common/roles';
export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
  type: TokenType;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
