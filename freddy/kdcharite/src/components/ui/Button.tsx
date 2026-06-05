import { cn } from "@/lib/utils";
import Link from "next/link";
import { type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "outline-white";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  external?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-green hover:bg-brand-green-light text-navy font-semibold shadow-lg hover:shadow-brand-green/30 hover:-translate-y-0.5",
  secondary:
    "bg-white/8 hover:bg-white/12 text-warm-white border border-white/10 hover:border-white/20",
  ghost:
    "bg-transparent hover:bg-white/5 text-muted hover:text-warm-white",
  gold:
    "bg-brand-gold hover:bg-brand-gold-light text-navy font-semibold shadow-lg hover:shadow-brand-gold/30 hover:-translate-y-0.5",
  "outline-white":
    "bg-transparent border border-white/20 hover:border-white/50 text-warm-white hover:bg-white/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
  xl: "px-8 py-4 text-lg rounded-2xl",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  onClick,
  type = "button",
  disabled,
  external,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 transition-all duration-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
