import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--playful-focus-ring))] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--playful-button-primary-background))] text-[hsl(var(--playful-button-primary-text-color))] shadow hover:bg-[hsl(var(--playful-button-primary-hover-background))]",
        destructive:
          "bg-[hsl(var(--playful-destructive-background))] text-[hsl(var(--playful-destructive-text-color))] shadow-sm hover:bg-[hsl(var(--playful-destructive-hover-background))]",
        outline:
          "border border-[hsl(var(--playful-card-border-color))] bg-[hsl(var(--playful-card-background))] shadow-sm hover:bg-[hsl(var(--playful-button-primary-hover-background))] hover:text-[hsl(var(--playful-button-primary-text-color))]",
        secondary:
          "bg-[hsl(var(--playful-secondary-background))] text-[hsl(var(--playful-secondary-text-color))] shadow-sm hover:bg-[hsl(var(--playful-secondary-hover-background))]",
        ghost: "hover:bg-[hsl(var(--playful-ghost-hover-background))] hover:text-[hsl(var(--playful-ghost-hover-text-color))]",
        link: "text-[hsl(var(--playful-link-text-color))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
