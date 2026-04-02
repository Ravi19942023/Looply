"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/atoms";
import type { UISuggestion } from "@/lib/editor/suggestions";

export const SuggestionDialog = ({
  suggestion,
  onApply,
  onClose,
}: {
  suggestion: UISuggestion;
  onApply: () => void;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          key={suggestion.id}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative z-50 flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-border/60 bg-background p-6 shadow-2xl shadow-neutral-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Suggestion</h3>
                <p className="text-xs text-muted-foreground">Surgical edit available</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Change Description</label>
            <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
              {suggestion.description}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 rounded-2xl h-11"
              onClick={onApply}
            >
              Apply Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-11"
              onClick={onClose}
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
