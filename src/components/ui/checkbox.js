import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (_jsx(CheckboxPrimitive.Root, { ref: ref, className: cn("peer h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--playful-card-border-color))] shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--playful-focus-ring-color))] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[hsl(var(--playful-button-primary-background))] data-[state=checked]:text-[hsl(var(--playful-button-primary-text-color))]", className), ...props, children: _jsx(CheckboxPrimitive.Indicator, { className: cn("flex items-center justify-center text-current"), children: _jsx(Check, { className: "h-4 w-4" }) }) })));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
