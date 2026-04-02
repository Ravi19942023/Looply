import { Button } from "@/components/atoms";
import { Modal } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { ConfirmationDialogProps } from "./ConfirmationDialog.types";

export function ConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading,
  className,
}: ConfirmationDialogProps & { className?: string }) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <div className={cn("flex flex-col gap-6", className)}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="hover:bg-muted"
          >
            {cancelLabel}
          </Button>
          <Button 
            isLoading={isLoading} 
            variant={variant === "danger" ? "destructive" : "primary"} 
            onClick={onConfirm}
            className="min-w-[80px]"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

