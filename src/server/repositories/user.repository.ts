/**
 * UserRepository — persistencia de usuarios (User = Usuario) — Sprint 3I
 */

import { MOCK_LAST_UPDATE } from "@/config";
import { isMonitoringDatabaseEnabled } from "@/config/monitoring-data-source.config";
import { getDataStore } from "@/data/store-access";
import { RolUsuario } from "@/constants/enums";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { CreateUserInput, UpdateUserInput, UserDto, UserStatus } from "@/server/dto/user.dto";
import { toAppRole, toRolUsuario } from "@/server/authorization/roles";

const mockOverlay = new Map<string, UserDto>();
const mockDeleted = new Set<string>();

function mapStatusToDb(status: UserStatus): { activo: boolean; estado: "active" | "inactive" } {
  return status === "active" ? { activo: true, estado: "active" } : { activo: false, estado: "inactive" };
}

function fromStoreUser(u: {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  institucion: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}): UserDto {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: toAppRole(u.rol),
    status: u.activo ? "active" : "inactive",
    institution: u.institucion,
    createdAt: u.createdAt ?? MOCK_LAST_UPDATE,
    updatedAt: u.updatedAt ?? MOCK_LAST_UPDATE,
  };
}

function fromDbUser(u: {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  institucion: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserDto {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: toAppRole(u.rol as RolUsuario),
    status: u.activo ? "active" : "inactive",
    institution: u.institucion,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function allMockUsers(): UserDto[] {
  const base = getDataStore()
    .usuarios.filter((u) => !mockDeleted.has(u.id))
    .map(fromStoreUser);
  const merged = new Map<string, UserDto>();
  base.forEach((u) => merged.set(u.id, u));
  mockOverlay.forEach((u, id) => {
    if (!mockDeleted.has(id)) merged.set(id, u);
  });
  return Array.from(merged.values());
}

async function allDatabaseUsers(): Promise<UserDto[]> {
  const rows = await prisma.usuario.findMany({
    where: { estado: "active" },
    orderBy: { nombre: "asc" },
  });
  const dbUsers = rows.map(fromDbUser);
  mockOverlay.forEach((u, id) => {
    if (!mockDeleted.has(id)) {
      const index = dbUsers.findIndex((row) => row.id === id);
      if (index >= 0) dbUsers[index] = u;
      else dbUsers.push(u);
    }
  });
  return dbUsers.filter((u) => !mockDeleted.has(u.id));
}

export class UserRepository {
  async findAll(): Promise<UserDto[]> {
    if (isMonitoringDatabaseEnabled()) {
      try {
        return await allDatabaseUsers();
      } catch {
        // fallback mock
      }
    }
    return allMockUsers().sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<UserDto | null> {
    if (isMonitoringDatabaseEnabled()) {
      try {
        const row = await prisma.usuario.findUnique({ where: { id } });
        if (row && !mockDeleted.has(id)) return fromDbUser(row);
      } catch {
        // fallback
      }
    }
    return allMockUsers().find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const normalized = email.toLowerCase();
    const users = isMonitoringDatabaseEnabled() ? await this.findAll() : allMockUsers();
    return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  async create(input: CreateUserInput): Promise<UserDto> {
    if (await this.findByEmail(input.email)) {
      throw ApiError.duplicate("Ya existe un usuario con ese email");
    }

    const id = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    const user: UserDto = {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status ?? "active",
      institution: input.institution,
      createdAt: now,
      updatedAt: now,
    };

    if (isMonitoringDatabaseEnabled()) {
      try {
        const dbStatus = mapStatusToDb(user.status);
        await prisma.usuario.create({
          data: {
            id,
            nombre: user.name,
            email: user.email,
            rol: toRolUsuario(user.role),
            institucion: user.institution,
            activo: dbStatus.activo,
            estado: dbStatus.estado,
            observaciones: "Usuario creado — Sprint 3I",
          },
        });
        return user;
      } catch {
        // mock fallback
      }
    }

    mockOverlay.set(id, user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<UserDto> {
    const current = await this.findById(id);
    if (!current) throw ApiError.notFound("Usuario", id);

    if (input.email && input.email !== current.email && (await this.findByEmail(input.email))) {
      throw ApiError.duplicate("Ya existe un usuario con ese email");
    }

    const updated: UserDto = {
      ...current,
      name: input.name ?? current.name,
      email: input.email ?? current.email,
      role: input.role ?? current.role,
      status: input.status ?? current.status,
      institution: input.institution ?? current.institution,
      updatedAt: new Date().toISOString(),
    };

    if (isMonitoringDatabaseEnabled()) {
      try {
        const dbStatus = mapStatusToDb(updated.status);
        await prisma.usuario.update({
          where: { id },
          data: {
            nombre: updated.name,
            email: updated.email,
            rol: toRolUsuario(updated.role),
            institucion: updated.institution,
            activo: dbStatus.activo,
            estado: dbStatus.estado,
          },
        });
        return updated;
      } catch {
        // mock fallback
      }
    }

    mockOverlay.set(id, updated);
    return updated;
  }

  async softDelete(id: string): Promise<UserDto> {
    const current = await this.findById(id);
    if (!current) throw ApiError.notFound("Usuario", id);

    const updated = await this.update(id, { status: "inactive" });
    mockDeleted.add(id);

    if (isMonitoringDatabaseEnabled()) {
      try {
        await prisma.usuario.update({
          where: { id },
          data: { activo: false, estado: "inactive" },
        });
      } catch {
        // ignore
      }
    }

    return updated;
  }
}

export const userRepository = new UserRepository();

export function resetUserRepositoryMock(): void {
  mockOverlay.clear();
  mockDeleted.clear();
}
