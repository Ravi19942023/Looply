"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AvatarProps } from "./Avatar.types";

export function Avatar({ src, fallback, alt, size = "md", className }: AvatarProps & { className?: string }) {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-lg",
  };

  const commonClasses = cn(
    "relative flex shrink-0 overflow-hidden rounded-full border border-border/10 bg-muted/40 font-medium text-muted-foreground transition-all hover:scale-105 active:scale-95",
    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
    className
  );

  if (!src || hasError) {
    return (
      <div 
        aria-label={alt} 
        className={cn(commonClasses, "items-center justify-center uppercase tracking-wider backdrop-blur-sm")} 
        role="img"
      >
        {fallback.slice(0, 2)}
      </div>
    );
  }

  return (
    <div className={commonClasses}>
      <Image 
        alt={alt} 
        fill 
        sizes="(max-width: 768px) 100vw, 48px" 
        src={src} 
        className="aspect-square h-full w-full object-cover"
        onError={() => setHasError(true)} 
      />
    </div>
  );
}

