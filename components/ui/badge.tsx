import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("amber-chip", { variants: { variant: { default: "", brand: "amber-chip--brand", success: "amber-chip--success", warning: "amber-chip--brand", danger: "amber-chip--danger", info: "amber-chip--info" } }, defaultVariants: { variant: "default" } });
function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) { return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />; }
export { Badge, badgeVariants };
