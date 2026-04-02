"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/atoms";
import { ConfirmationDialog } from "@/components/feedback";
import { Select, Tabs, TextInput, Textarea, Toggle } from "@/components/forms";
import { Drawer } from "@/components/layout";
import { cn } from "@/lib/utils";
import { DEFAULT_CAMPAIGN_FORM } from "../constants";
import { CampaignDraftSchema } from "../validators";
import type { CampaignFormState } from "../types";
import { Info, Sparkles } from "lucide-react";

const steps = [
  { label: "Audience", value: "audience" },
  { label: "Message", value: "message" },
  { label: "Preview", value: "preview" },
  { label: "Send", value: "send" },
] as const;

export function CampaignWizard({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  className,
}: Readonly<{
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (draft: CampaignFormState) => Promise<void>;
  className?: string;
}>) {
  const [step, setStep] = useState<(typeof steps)[number]["value"]>("audience");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CampaignFormState>({ ...DEFAULT_CAMPAIGN_FORM });
  const stepIndex = useMemo(() => steps.findIndex((item) => item.value === step), [step]);

  const updateDraft = useCallback(<K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleStepChange = useCallback((value: string) => {
    setStep(value as (typeof steps)[number]["value"]);
  }, []);

  const handleNextStep = useCallback(() => {
    setStep(steps[Math.min(steps.length - 1, stepIndex + 1)]?.value ?? "send");
  }, [stepIndex]);

  const handlePreviousStep = useCallback(() => {
    setStep(steps[Math.max(0, stepIndex - 1)]?.value ?? "audience");
  }, [stepIndex]);

  const handleConfirmSend = useCallback(async () => {
    const parsed = CampaignDraftSchema.safeParse(draft);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Unable to save this campaign.");
      setIsConfirmOpen(false);
      return;
    }

    await onSubmit(parsed.data);
    setDraft({ ...DEFAULT_CAMPAIGN_FORM });
    setIsConfirmOpen(false);
    setStep("audience");
    setError(null);
    onClose();
  }, [draft, onSubmit, onClose]);

  const openConfirm = useCallback(() => setIsConfirmOpen(true), []);
  const closeConfirm = useCallback(() => setIsConfirmOpen(false), []);

  const handleSegmentChange = useCallback((value: string | string[]) => {
    updateDraft("segment", String(Array.isArray(value) ? value[0] : value));
  }, [updateDraft]);
  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => updateDraft("name", event.target.value), [updateDraft]);
  const handleSubjectChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => updateDraft("subject", event.target.value), [updateDraft]);
  const handleBodyChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => updateDraft("message", event.target.value), [updateDraft]);
  const handleAiToggle = useCallback((checked: boolean) => updateDraft("aiEnhanced", checked), [updateDraft]);

  return (
    <>
      <Drawer isOpen={isOpen} size="lg" title="Create campaign" onClose={onClose}>
        <div className={cn("flex flex-col h-full gap-8", className)}>
            <Tabs
              ariaLabel="Campaign wizard steps"
              tabs={[...steps]}
              value={step}
              onValueChange={handleStepChange}
              className="shrink-0"
            />

            <div className="flex-1 overflow-y-auto min-h-[400px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {step === "audience" && (
                <div className="space-y-6">
                  <Select
                    label="Audience segment"
                    className="bg-background/50 backdrop-blur-sm"
                    options={[
                      { label: "General", value: "general" },
                      { label: "VIP Customers", value: "vip" },
                      { label: "Returning Users", value: "returning" },
                    ]}
                    value={draft.segment}
                    onChange={handleSegmentChange}
                  />
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select the segment you want to target. Segments are dynamically updated based on customer behavior.
                  </p>
                </div>
              </div>
            )}

            {step === "message" && (
              <div className="space-y-6">
                  <TextInput
                    label="Campaign name"
                    placeholder="e.g. Q4 Loyalty Program"
                    value={draft.name}
                    onChange={handleNameChange}
                    className="bg-background/50 backdrop-blur-sm"
                  />
                  <TextInput
                    label="Subject line"
                    placeholder="The subject your customers will see"
                    value={draft.subject}
                    onChange={handleSubjectChange}
                    className="bg-background/50 backdrop-blur-sm"
                  />
                  <Textarea
                    label="Message body"
                    placeholder="Draft your communication here..."
                    value={draft.message}
                    onChange={handleBodyChange}
                    className="min-h-[200px] bg-background/50 backdrop-blur-sm"
                  />
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/30">
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                         <Sparkles className="size-3.5 text-primary" />
                         AI Copilot
                      </p>
                      <p className="text-xs text-muted-foreground/60">Optimizes readability and engagement</p>
                    </div>
                    <Toggle
                      label="AI Enhanced"
                      checked={draft.aiEnhanced}
                      onCheckedChange={handleAiToggle}
                    />
                  </div>
              </div>
            )}

            {step === "preview" && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-background">
                   <div className="bg-muted/30 p-4 border-b border-border/40 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Preview Mode</p>
                      <h4 className="text-sm font-semibold">{draft.subject || "(No subject)"}</h4>
                   </div>
                   <div className="p-8 prose prose-sm max-w-none text-foreground/80 leading-loose">
                     {draft.message || "Your message draft will appear here."}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] font-medium text-muted-foreground/50 px-2">
                  <p>Segment: <span className="text-foreground/60">{draft.segment}</span></p>
                  <p>AI Enhancement: <span className="text-foreground/60">{draft.aiEnhanced ? "Active" : "Disabled"}</span></p>
                </div>
              </div>
            )}

            {step === "send" && (
              <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Info className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Final Review</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Review your campaign one last time. Once sent, campaigns cannot be edited in the current cycle.
                  </p>
                </div>
                  <Button size="lg" className="rounded-xl px-8" onClick={openConfirm}>
                    Confirm & Dispatch
                  </Button>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in scale-95">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border/40 shrink-0">
            <Button
              disabled={stepIndex === 0}
              variant="outline"
              onClick={handlePreviousStep}
              className="rounded-xl"
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={stepIndex === steps.length - 1}
                onClick={handleNextStep}
                className="rounded-xl px-8"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmationDialog
        confirmLabel="Dispatch Now"
        description="This will immediately push your campaign to the selected distribution channel. Are you sure you want to proceed?"
        isLoading={isSaving}
        isOpen={isConfirmOpen}
        title="Final Dispatch Confirmation"
        onCancel={closeConfirm}
        onConfirm={handleConfirmSend}
      />
    </>
  );
}

