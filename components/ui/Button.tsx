import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "quiet" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-accent to-brand text-[color:var(--gold-soft)] shadow-[var(--glow-gold)] hover:brightness-105",
  quiet: "bg-surface-2 text-ink hover:brightness-110",
  ghost:
    "bg-transparent text-ink border-[1.5px] border-line-2 hover:border-muted",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-3 text-[15px] font-extrabold tracking-tight transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
