import * as React from "react";
import { cn } from "@/lib/utils";

function PageContainer({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="page-container" className={cn("amber-page-container", className)} {...props} />; }
function PageSection({ className, ...props }: React.ComponentProps<"section">) { return <section data-slot="page-section" className={cn("amber-panel", className)} {...props} />; }
function SectionHeader({ className, ...props }: React.ComponentProps<"header">) { return <header data-slot="section-header" className={cn("amber-section-header", className)} {...props} />; }
export { PageContainer, PageSection, SectionHeader };
