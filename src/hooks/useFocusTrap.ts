"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

const focusableSelectors = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  isActive: boolean,
): void {
  useEffect(() => {
    if (!isActive || !ref.current) {
      return;
    }

    const container = ref.current;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab" || !first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, ref]);
}
