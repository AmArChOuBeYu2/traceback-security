import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-cyan disabled:pointer-events-none disabled:opacity-50 tracking-wide cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-cyber-cyan text-cyber-dark hover:bg-cyber-cyan/90 font-semibold shadow-cyan-glow",
        destructive:
          "bg-cyber-red text-white hover:bg-cyber-red/90 shadow-red-glow",
        outline:
          "border border-slate-700 bg-surface/50 text-slate-200 hover:bg-surface-hover hover:border-cyber-cyan/50",
        ghost:
          "text-slate-300 hover:bg-slate-800/60 hover:text-cyber-cyan",
        cyber:
          "border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 hover:border-cyber-cyan shadow-cyan-glow",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonVariants({ variant, size, className }), (children.props as any).className),
        ...props,
      });
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
