export type UserType = 'student' | 'psychologist' | 'admin';

export interface AuthUser {
  studentId?: string;
  psychologistId?: string;
  type: UserType;
}

export interface JwtPayload {
  sub: string;
  type: UserType;
}
