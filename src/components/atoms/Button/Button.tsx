"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 hover:shadow-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        outline:
          "border border-border/60 bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent/40",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-glow shadow-destructive/10 hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-br from-primary to-accent text-white shadow-glow hover:opacity-90",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "size-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  href?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, href, leftIcon, rightIcon, isLoading, disabled, children, ...props }, ref) => {
    const Comp = href ? "a" : "button";
    const content = (
      <>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        <span className={cn(isLoading && "opacity-0 invisible")}>{children}</span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </>
    );

    const buttonClasses = cn(buttonVariants({ variant, size, fullWidth, className }), "relative");

    if (href) {
      return (
        <Link
          href={href as any}
          className={cn(buttonClasses, (disabled || isLoading) && "pointer-events-none opacity-50")}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        className={buttonClasses}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

