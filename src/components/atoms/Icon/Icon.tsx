import type { CSSProperties } from "react";

import type { IconProps } from "./Icon.types";

export function Icon({
  icon: LucideIconComponent,
  size = 20,
  color,
  strokeWidth = 1.75,
  className,
  ariaLabel,
}: IconProps) {
  const style: CSSProperties | undefined = color ? { color } : undefined;

  return (
    <LucideIconComponent
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={className}
      role={ariaLabel ? "img" : undefined}
      size={size}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
