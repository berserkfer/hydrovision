"use client";

import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(error: unknown, fallback = "Ocurrió un error"): void {
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }
  toast.error(fallback);
}

export async function withApiToast<T>(
  action: () => Promise<T>,
  messages: { success: string; error?: string }
): Promise<T | null> {
  try {
    const result = await action();
    notifySuccess(messages.success);
    return result;
  } catch (error) {
    notifyError(error, messages.error);
    return null;
  }
}
