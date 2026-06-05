import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "gold" | "white" | "outline";
  className?: string;
}

export default function Badge({ children, variant = "green", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase",
        variant === "green" && "bg-brand-green/10 text-brand-green border border-brand-green/20",
        variant === "gold" && "bg-brand-gold/10 text-brand-gold border border-brand-gold/20",
        variant === "white" && "bg-white/10 text-warm-white border border-white/15",
        variant === "outline" && "border border-white/20 text-muted",
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        variant === "green" && "bg-brand-green animate-pulse-soft",
        variant === "gold" && "bg-brand-gold animate-pulse-soft",
        variant === "white" && "bg-warm-white",
        variant === "outline" && "bg-muted",
      )} />
      {children}
    </span>
  );
}
