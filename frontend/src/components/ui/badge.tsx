import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-800 text-slate-200",
        cyan:
          "border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan",
        emerald:
          "border-cyber-emerald/30 bg-cyber-emerald/10 text-cyber-emerald",
        destructive:
          "border-cyber-red/30 bg-cyber-red/10 text-cyber-red",
        red:
          "border-cyber-red/30 bg-cyber-red/10 text-cyber-red",
        amber:
          "border-cyber-amber/30 bg-cyber-amber/10 text-cyber-amber",
        outline:
          "border-slate-700 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
