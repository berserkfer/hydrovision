"use client";

import { Pencil, UserX } from "lucide-react";
import { APP_ROLE_LABELS } from "@/server/authorization/roles";
import type { UserDto } from "@/server/dto/user.dto";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";

interface UserTableProps {
  users: UserDto[];
  onEdit: (user: UserDto) => void;
  onToggleStatus: (user: UserDto) => void;
}

export function UserTable({ users, onEdit, onToggleStatus }: UserTableProps) {
  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No hay usuarios registrados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Nombre</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Rol</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium">Creación</th>
            <th className="px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-900">{user.name}</td>
              <td className="px-3 py-2 text-slate-700">{user.email}</td>
              <td className="px-3 py-2 text-slate-700">{APP_ROLE_LABELS[user.role]}</td>
              <td className="px-3 py-2">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="px-3 py-2 text-xs text-slate-600">
                {new Date(user.createdAt).toLocaleDateString("es-PE")}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserX className="h-3 w-3" />
                    {user.status === "active" ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
