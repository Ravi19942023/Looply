"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import type { SearchInputProps } from "./SearchInput.types";

export function SearchInput({
  value,
  defaultValue = "",
  placeholder = "Search...",
  ariaLabel = "Search",
  disabled,
  loading,
  onValueChange,
  className,
}: SearchInputProps & { className?: string }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleClear() {
    if (value === undefined) {
      setInternalValue("");
    }
    onValueChange?.("");
  }

  return (
    <div className={cn(
      "group relative flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-3.5 h-11 transition-all backdrop-blur-sm shadow-sm ring-offset-background",
      "hover:border-border/60",
      "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      <Search 
        aria-hidden="true" 
        className={cn(
          "size-4 text-muted-foreground/60 transition-colors",
          "group-focus-within:text-primary"
        )} 
      />
      
      <input
        aria-label={ariaLabel}
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed"
        disabled={disabled}
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
      />

      <div className="flex items-center gap-2 shrink-0">
        {loading && (
          <Loader2 className="size-3.5 text-muted-foreground/60 animate-spin" />
        )}
        
        {currentValue && !disabled && (
          <Button 
            aria-label="Clear search" 
            variant="ghost" 
            size="icon" 
            className="size-7 rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-foreground"
            onClick={handleClear}
          >
            <X aria-hidden="true" className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

