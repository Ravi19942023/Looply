import type { ReactNode } from "react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastRecord extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

export interface ToastContextValue {
  toast: (toast: ToastInput) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
}
