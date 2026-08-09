import type { PropsWithChildren, HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  glass?: boolean;
  animateIn?: boolean;
  delay?: number; // animation-delay in ms
}

export function Panel({
  className = "",
  glass = false,
  animateIn = false,
  delay = 0,
  children,
  style,
  ...rest
}: PropsWithChildren<PanelProps>) {
  return (
    <div
      className={`notch border border-hairline ${glass ? "glass" : "bg-surface"} ${animateIn ? "animate-fade-up" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  );
}
