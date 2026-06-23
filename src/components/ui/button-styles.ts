import { cn } from "@/lib/utils";

export const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20",
  secondary: "bg-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/20",
  ghost: "bg-transparent hover:bg-foreground/5 text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
  outline: "border border-border bg-card hover:bg-foreground/5 text-foreground",
} as const;

export const buttonSizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

interface ButtonStylesOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStylesOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );
}
