"use client";

import { PERMISSION_LABELS, type PermissionCode } from "@/server/authorization/permissions";
import { APP_ROLE_LABELS, APP_ROLES, type AppRole } from "@/server/authorization/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface PermissionMatrixProps {
  matrix: Array<{
    code: PermissionCode;
    label: string;
    category: string;
    roles: AppRole[];
  }>;
}

export function PermissionMatrix({ matrix }: PermissionMatrixProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Matriz de permisos por rol</CardTitle>
        <CardDescription>Los permisos dependen del rol — no se editan por usuario individual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-2 pr-3 font-medium">Permiso</th>
                {APP_ROLES.map((role) => (
                  <th key={role} className="pb-2 px-2 text-center font-medium">
                    {APP_ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.code} className="border-b border-slate-100">
                  <td className="py-2 pr-3">
                    <span className="font-medium text-slate-800">{row.label}</span>
                    <span className="ml-2 text-slate-400">{row.code}</span>
                  </td>
                  {APP_ROLES.map((role) => (
                    <td key={role} className="py-2 px-2 text-center">
                      {row.roles.includes(role) ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Referencia: {Object.keys(PERMISSION_LABELS).length} permisos definidos en el sistema.
        </p>
      </CardContent>
    </Card>
  );
}
