/**
 * Esquemas de validación — usuarios Sprint 3I
 */

import { z } from "zod";
import { APP_ROLES } from "@/server/authorization/roles";

export const createUserSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().max(255),
  role: z.enum(APP_ROLES),
  institution: z.string().min(2).max(200),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(APP_ROLES).optional(),
  institution: z.string().min(2).max(200).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
