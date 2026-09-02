"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, UserPlus, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoringHeader } from "@/components/layout/MonitoringHeader";
import { PageContent } from "@/components/layout/PageContent";
import { Card } from "@/components/ui/Card";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import { UserForm, userToFormValues, type UserFormValues } from "@/components/users/UserForm";
import { UserTable } from "@/components/users/UserTable";
import { MOCK_LAST_UPDATE } from "@/constants/app";
import { createUser, fetchUsers, updateUser } from "@/lib/api/users.client";
import { notifyError, notifySuccess } from "@/lib/api/notify";
import type { PermissionCode } from "@/server/authorization/permissions";
import type { AppRole } from "@/server/authorization/roles";
import type { UserDto } from "@/server/dto/user.dto";

interface UsersViewProps {
  initialUsers: UserDto[];
  permissionMatrix: Array<{
    code: PermissionCode;
    label: string;
    category: string;
    roles: AppRole[];
  }>;
  devUserId: string;
}

export function UsersView({ initialUsers, permissionMatrix, devUserId }: UsersViewProps) {
  const [users, setUsers] = useState(initialUsers);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [simulatedUser, setSimulatedUser] = useState(devUserId);

  useEffect(() => {
    localStorage.setItem("hv-dev-user", simulatedUser);
  }, [simulatedUser]);

  const refresh = useCallback(async () => {
    const data = await fetchUsers();
    setUsers(data.users);
  }, []);

  const handleCreate = async (values: UserFormValues) => {
    try {
      await createUser(values);
      notifySuccess("Usuario creado");
      await refresh();
      setMode("list");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al crear usuario");
    }
  };

  const handleUpdate = async (values: UserFormValues) => {
    if (!editing) return;
    try {
      await updateUser(editing.id, values);
      notifySuccess("Usuario actualizado");
      await refresh();
      setMode("list");
      setEditing(null);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al actualizar usuario");
    }
  };

  const handleToggleStatus = async (user: UserDto) => {
    try {
      await updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" });
      notifySuccess(user.status === "active" ? "Usuario desactivado" : "Usuario activado");
      await refresh();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  return (
    <MainLayout>
      <MonitoringHeader
        lastUpdate={MOCK_LAST_UPDATE}
        title="Usuarios y Permisos"
        subtitle="Gestión de cuentas ficticias de desarrollo — HydroVision Sprint 3I"
      />

      <PageContent className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-amber-900">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              Modo desarrollo: simule un usuario con{" "}
              <code className="rounded bg-amber-100 px-1">DEV_SIMULATED_USER_ID</code> o selección
              rápida:
            </span>
            <select
              value={simulatedUser}
              onChange={(e) => setSimulatedUser(e.target.value)}
              className="rounded border border-amber-300 bg-white px-2 py-1 text-xs"
            >
              <option value="usr-admin">Admin</option>
              <option value="usr-investigador">Investigador</option>
              <option value="usr-operador">Técnico</option>
              <option value="usr-visor">Visor</option>
              <option value="usr-inactivo">Inactivo</option>
            </select>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-600" />
              <h2 className="text-sm font-semibold text-slate-900">Usuarios del sistema</h2>
            </div>
            {mode === "list" && (
              <button
                type="button"
                onClick={() => setMode("create")}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                <UserPlus className="h-4 w-4" />
                Crear usuario
              </button>
            )}
          </div>

          {mode === "list" && (
            <UserTable
              users={users}
              onEdit={(user) => {
                setEditing(user);
                setMode("edit");
              }}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {mode === "create" && (
            <UserForm
              submitLabel="Crear usuario"
              onSubmit={handleCreate}
              onCancel={() => setMode("list")}
            />
          )}

          {mode === "edit" && editing && (
            <UserForm
              initial={userToFormValues(editing)}
              submitLabel="Guardar cambios"
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditing(null);
                setMode("list");
              }}
            />
          )}
        </Card>

        <PermissionMatrix matrix={permissionMatrix} />
      </PageContent>
    </MainLayout>
  );
}
