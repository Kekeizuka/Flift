import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,opacity] active:scale-[.97] disabled:pointer-events-none disabled:opacity-40 select-none focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-arena text-white font-semibold glow-crimson",
        success: "bg-lime text-ink font-semibold",
        secondary: "bg-raised text-text border border-line",
        outline: "border border-line text-text hover:bg-raised",
        ghost: "text-muted hover:text-text hover:bg-raised",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-6 text-base",
        icon: "h-11 w-11",
        iconSm: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
