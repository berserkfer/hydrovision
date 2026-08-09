"use client";

import { useState } from "react";
import { FormField, TextInput } from "@/components/ui/FormField";
import { RoleSelector } from "@/components/users/RoleSelector";
import type { AppRole } from "@/server/authorization/roles";
import type { UserDto, UserStatus } from "@/server/dto/user.dto";

export interface UserFormValues {
  name: string;
  email: string;
  role: AppRole;
  institution: string;
  status: UserStatus;
}

interface UserFormProps {
  initial?: Partial<UserFormValues>;
  submitLabel: string;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel?: () => void;
}

const DEFAULT_VALUES: UserFormValues = {
  name: "",
  email: "",
  role: "VIEWER",
  institution: "HydroVision — cuenta ficticia",
  status: "active",
};

export function UserForm({ initial, submitLabel, onSubmit, onCancel }: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>({ ...DEFAULT_VALUES, ...initial });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField id="user-name" label="Nombre">
        <TextInput
          id="user-name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </FormField>
      <FormField id="user-email" label="Email">
        <TextInput
          id="user-email"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          required
        />
      </FormField>
      <FormField id="user-institution" label="Institución">
        <TextInput
          id="user-institution"
          value={values.institution}
          onChange={(e) => setValues((v) => ({ ...v, institution: e.target.value }))}
          required
        />
      </FormField>
      <FormField id="user-role" label="Rol">
        <RoleSelector value={values.role} onChange={(role) => setValues((v) => ({ ...v, role }))} />
      </FormField>
      <FormField id="user-status" label="Estado">
        <select
          id="user-status"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as UserStatus }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </FormField>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? "Guardando…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-600 hover:text-slate-800">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function userToFormValues(user: UserDto): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    institution: user.institution,
    status: user.status,
  };
}
