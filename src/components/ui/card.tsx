import React from 'react';
import { cn } from 'src/libs/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.SyntheticEvent) => void;
  variant?: 'default' | 'glass' | 'gradient' | 'outline';
  animate?: boolean;
  interactive?: boolean; // Explicitly opt-in to hover scale effect
}

export function Card({
  children,
  className,
  onClick,
  variant = 'default',
  animate = false,
  interactive = false
}: CardProps) {
  const variants = {
    default: "bg-card border border-border/50 shadow-card dark:shadow-card-dark",
    glass: "glass",
    gradient: "bg-gradient-to-br from-card to-muted border border-border/30",
    outline: "bg-transparent border border-border",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl p-2 transition-all duration-300",
        variants[variant],
        interactive && "cursor-pointer hover:shadow-lg hover:border-primary/20 hover:scale-[1.01]",
        onClick && !interactive && "cursor-pointer",
        animate && "animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
}

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";