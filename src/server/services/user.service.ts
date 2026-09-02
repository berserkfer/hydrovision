/**
 * UserService — gestión de usuarios — Sprint 3I
 */

import { auditService } from "@/server/audit/audit.service";
import { ApiError } from "@/server/api/errors";
import type { CreateUserInput, UpdateUserInput, UserDto, UserListResponseDto } from "@/server/dto/user.dto";
import { userRepository } from "@/server/repositories/user.repository";
import { createUserSchema, updateUserSchema } from "@/server/validators/schemas/user.schemas";
import { parseBody } from "@/server/validators/schemas/crud.schemas";

export class UserService {
  async list(): Promise<UserListResponseDto> {
    const users = await userRepository.findAll();
    return { users, total: users.length };
  }

  async getById(id: string): Promise<UserDto> {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound("Usuario", id);
    return user;
  }

  async create(body: unknown): Promise<UserDto> {
    const input = parseBody(createUserSchema, body) as CreateUserInput;
    const created = await userRepository.create(input);
    void auditService.recordCreate("User", created.id, created, `Usuario ${created.email} creado`);
    return created;
  }

  async update(id: string, body: unknown): Promise<UserDto> {
    const previous = await userRepository.findById(id);
    if (!previous) throw ApiError.notFound("Usuario", id);

    const input = parseBody(updateUserSchema, body) as UpdateUserInput;
    const updated = await userRepository.update(id, input);

    if (input.role && input.role !== previous.role) {
      void auditService.recordUpdate(
        "User",
        id,
        { role: previous.role },
        { role: updated.role },
        `Rol cambiado de ${previous.role} a ${updated.role}`
      );
    }

    if (input.status && input.status !== previous.status) {
      void auditService.recordUpdate(
        "User",
        id,
        { status: previous.status },
        { status: updated.status },
        input.status === "active" ? "Usuario activado" : "Usuario desactivado"
      );
    }

    if (
      (input.name && input.name !== previous.name) ||
      (input.email && input.email !== previous.email) ||
      (input.institution && input.institution !== previous.institution)
    ) {
      void auditService.recordUpdate("User", id, previous, updated, `Usuario ${updated.email} actualizado`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const previous = await userRepository.findById(id);
    if (!previous) throw ApiError.notFound("Usuario", id);
    await userRepository.softDelete(id);
    void auditService.recordDelete("User", id, previous, `Usuario ${previous.email} desactivado (eliminación lógica)`);
    return { id, deleted: true };
  }
}

export const userService = new UserService();
