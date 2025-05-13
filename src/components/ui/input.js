import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (_jsx("input", { type: type, className: cn("flex h-9 w-full rounded-md border border-[hsl(var(--playful-card-border-color))] bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950 placeholder:text-[hsl(var(--playful-input-placeholder-color))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--playful-focus-ring-color))] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className), ref: ref, ...props }));
});
Input.displayName = "Input";
export { Input };
