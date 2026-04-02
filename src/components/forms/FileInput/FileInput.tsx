import { cn } from "@/lib/utils";
import type { FileInputProps } from "./FileInput.types";

export function FileInput({
  label,
  accept,
  multiple,
  disabled,
  onFilesChange,
  className,
}: FileInputProps & { className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground/80 leading-none">
        {label}
      </label>
      <input 
        type="file" 
        accept={accept} 
        disabled={disabled} 
        multiple={multiple} 
        onChange={(event) => onFilesChange?.(event.target.files)}
        className={cn(
          "flex w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm ring-offset-background transition-all",
          "file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-bold file:uppercase file:tracking-wider file:px-3 file:py-1 file:rounded-lg file:mr-4 file:hover:bg-primary/20 file:transition-colors file:cursor-pointer",
          "hover:border-border/60 backdrop-blur-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
    </div>
  );
}

