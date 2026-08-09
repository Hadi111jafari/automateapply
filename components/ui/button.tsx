import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "amber-button",
        outline:
          "amber-button-ghost",
        secondary:
          "amber-button-ghost",
        ghost:
          "amber-button-quiet",
        destructive:
          "border-danger/25 bg-danger/10 text-danger hover:bg-danger/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-sm",
        xs: "h-7 px-2.5 text-xs",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-13 px-7 text-[15px]",
        icon: "amber-icon-button",
        "icon-xs": "size-6 rounded-sm",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "amber-icon-button size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
