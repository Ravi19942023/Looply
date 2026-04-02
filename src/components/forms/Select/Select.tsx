"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectProps } from "./Select.types";

export function Select<T extends string | number>({
  options,
  value,
  onChange,
  label,
  placeholder,
  isMulti,
  error,
  disabled,
  className,
}: SelectProps<T> & { className?: string }) {
  const normalizedValue = value == null ? (isMulti ? [] : "") : value;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (isMulti) {
      const next = Array.from(event.target.selectedOptions).map((option) => option.value as T);
      onChange(next);
      return;
    }

    onChange(event.target.value as T);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground/80 leading-none">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={cn(
            "flex w-full appearance-none rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-border/60 backdrop-blur-sm shadow-sm pr-10",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          disabled={disabled}
          multiple={isMulti}
          value={normalizedValue as string | string[]}
          onChange={handleChange}
        >
          {!isMulti && placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <ChevronDown className="size-4" />
        </div>
      </div>
      {error && (
        <p className="text-xs font-medium text-destructive transition-all animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

