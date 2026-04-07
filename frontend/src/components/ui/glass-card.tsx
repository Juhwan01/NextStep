import { HTMLAttributes, forwardRef } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle";
  glow?: "none" | "blue" | "teal";
  padding?: "sm" | "md" | "lg";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className = "", variant = "default", glow = "none", padding = "md", children, ...props }, ref) => {
    const baseStyles = "rounded-xl border transition-all duration-300";

    const variants = {
      default: "bg-white/5 backdrop-blur-[12px] border-white/10",
      elevated: "bg-white/8 backdrop-blur-[16px] border-white/15 shadow-xl",
      subtle: "bg-white/3 backdrop-blur-[8px] border-white/5",
    };

    const glows = {
      none: "",
      blue: "shadow-[0_0_20px_rgba(0,212,255,0.15)]",
      teal: "shadow-[0_0_20px_rgba(0,255,213,0.15)]",
    };

    const paddings = {
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${glows[glow]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
export { GlassCard };
export type { GlassCardProps };
