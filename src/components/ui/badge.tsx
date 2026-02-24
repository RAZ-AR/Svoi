// Svoi — Badge component
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          default:   "bg-primary/10 text-primary",
          secondary: "bg-secondary text-secondary-foreground",
          outline:   "border border-border text-foreground",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
