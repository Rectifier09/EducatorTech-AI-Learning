import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "indigo" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent text-[#3a2408] hover:brightness-95",
  indigo: "bg-brand text-white hover:brightness-110",
  ghost: "bg-transparent text-ink border-[1.5px] border-line-2 hover:border-muted",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-[15px] font-extrabold tracking-tight transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
