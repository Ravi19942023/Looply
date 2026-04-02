import { FileText, MessageSquarePlus, PanelLeftOpen, Share2, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatHeader({
  title,
  isLoading,
  hasArtifact,
  onNewChat,
  onOpenArtifact,
  onToggle,
}: Readonly<{
  title: string;
  isLoading: boolean;
  hasArtifact: boolean;
  onNewChat: () => void;
  onOpenArtifact: () => void;
  onToggle: () => void;
}>) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border/10 bg-background/30 px-6 py-3.5 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm active:scale-95"
          aria-label="Toggle history"
        >
          <PanelLeftOpen className="size-4" />
        </button>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[240px]">
              {title}
            </h1>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider animate-in fade-in zoom-in duration-500">
              <Sparkles className="size-2.5 animate-pulse" />
              <span>GPT-4o</span>
              <ChevronDown className="size-2.5 opacity-50" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mt-0.5">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-primary animate-ping" />
                Thinking...
              </span>
            ) : (
              "Assistant Active"
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {hasArtifact && (
          <button
            type="button"
            onClick={onOpenArtifact}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/10 hover:shadow-glow active:scale-95"
          >
            <FileText className="size-3.5" />
            Artifact
          </button>
        )}
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm active:scale-95"
          aria-label="Share chat"
        >
          <Share2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
        >
          <MessageSquarePlus className="size-3.5" />
          New chat
        </button>
      </div>
    </header>
  );
}


