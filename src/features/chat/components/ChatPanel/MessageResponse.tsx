"use client";

import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { memo } from "react";
import { Streamdown } from "streamdown";

import "katex/dist/katex.min.css";

const streamdownPlugins = { cjk, code, math, mermaid };

export type MessageResponseProps = {
  children: string;
  className?: string;
};

export const MessageResponse = memo(
  ({ className, children }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-transparent [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      plugins={streamdownPlugins}
      shikiTheme={["github-dark", "github-dark"]}
      mermaid={{ config: { theme: "dark" } }}
    >
      {children}
    </Streamdown>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageResponse.displayName = "MessageResponse";
