import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/95 text-primary-foreground shadow hover:bg-primary/80 backdrop-blur-sm",
        destructive: "bg-destructive/95 text-destructive-foreground shadow-sm hover:bg-destructive/80 backdrop-blur-sm",
        outline:
          "border border-white/40 bg-white/50 text-foreground shadow-sm backdrop-blur-sm hover:bg-white/75 hover:text-foreground",
        secondary: "bg-white/50 text-foreground shadow-sm backdrop-blur-sm hover:bg-white/75",
        ghost: "hover:bg-white/30 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        coral: "bg-coral/95 text-coral-foreground chunky-border badge-shadow hover:bg-coral/80 hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        sunshine: "bg-sunshine/95 text-sunshine-foreground chunky-border badge-shadow hover:bg-sunshine/80 hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        mint: "bg-mint/95 text-mint-foreground chunky-border badge-shadow hover:bg-mint/80 hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        sky: "bg-sky/95 text-sky-foreground chunky-border badge-shadow hover:bg-sky/80 hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        badge: "bg-white/55 text-foreground border-2 border-white/40 chunky-border badge-shadow backdrop-blur-sm hover:bg-white/75 hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        gradient: "stat-gradient-violet chunky-border badge-shadow hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold",
        gradientDark: "stat-gradient-dark badge-shadow hover:translate-y-[-2px] active:translate-y-[1px] transition-transform rounded-2xl font-semibold border-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-14 rounded-2xl px-8 text-base",
        massive: "h-28 rounded-3xl px-10 text-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
