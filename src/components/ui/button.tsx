import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-[transform,filter,box-shadow,background] duration-200 ease-out hover:scale-[1.03] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        default: "btn-gradient-coral btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        destructive: "bg-destructive/95 text-destructive-foreground shadow-sm hover:bg-destructive/80 backdrop-blur-sm",
        outline:
          "btn-gradient-glass btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        secondary: "btn-gradient-glass btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        ghost: "hover:bg-white/30 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        coral: "btn-gradient-coral btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        sunshine: "btn-gradient-sunshine btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        mint: "btn-gradient-mint btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        sky: "btn-gradient-sky btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        badge: "btn-gradient-glass btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        gradient: "btn-gradient-violet btn-glossy chunky-border badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold",
        gradientDark: "stat-gradient-dark btn-glossy badge-shadow-pop hover:translate-y-[-2px] active:translate-y-[1px] rounded-2xl font-semibold border-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-10 w-10 rounded-full p-0 [&_svg]:size-[18px]",
        xl: "h-14 rounded-2xl px-8 text-base",
        massive: "h-28 rounded-3xl px-10 text-2xl",
      },
    },
    compoundVariants: [
      // Upgrade plain ghost icon buttons to look like the chunky yellow badge reference
      {
        variant: "ghost",
        size: "icon",
        className:
          "btn-gradient-sunshine btn-glossy chunky-border badge-shadow-pop text-foreground hover:translate-y-[-2px] active:translate-y-[1px] hover:bg-transparent",
      },
      {
        variant: "link",
        size: "icon",
        className:
          "btn-gradient-sunshine btn-glossy chunky-border badge-shadow-pop text-foreground hover:translate-y-[-2px] active:translate-y-[1px] no-underline hover:no-underline",
      },
    ],
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
