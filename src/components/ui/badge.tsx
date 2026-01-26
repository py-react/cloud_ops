import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "src/libs/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow shadow-primary/20 hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/10 text-destructive border-destructive/20 shadow-sm shadow-destructive/10 hover:bg-destructive/20",
        outline: "text-foreground bg-background/50 backdrop-blur-sm border-border/50",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/20",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 shadow-sm shadow-amber-500/10 hover:bg-amber-500/20",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-500 shadow-sm shadow-sky-500/10 hover:bg-sky-500/20",
        glow:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
