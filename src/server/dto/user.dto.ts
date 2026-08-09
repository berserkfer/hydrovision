/**
 * DTOs de usuario — Sprint 3I (User ↔ Usuario en PostgreSQL)
 */

import type { AppRole } from "@/server/authorization/roles";

export type UserStatus = "active" | "inactive";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: UserStatus;
  institution: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponseDto {
  users: UserDto[];
  total: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: AppRole;
  institution: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: AppRole;
  institution?: string;
  status?: UserStatus;
}
