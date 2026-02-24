// Svoi — Wizard step progress bar
import { cn } from "@/lib/utils";
import type { WizardStep } from "@/store/new-listing.store";

const STEPS = [
  { n: 1, label: "Категория" },
  { n: 2, label: "Фото"      },
  { n: 3, label: "Детали"    },
  { n: 4, label: "Адрес"     },
] as const;

interface WizardProgressProps {
  current: WizardStep;
}

export function WizardProgress({ current }: WizardProgressProps) {
  return (
    <div className="px-5 pt-3 pb-1">
      {/* Steps row */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone   = step.n < current;
          const isActive = step.n === current;

          return (
            <div key={step.n} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Connector + circle row */}
              <div className="flex w-full items-center">
                {/* Left connector (hidden on first step) */}
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-300",
                    i === 0 ? "invisible" : isDone || isActive ? "bg-primary" : "bg-gray-200"
                  )}
                />
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                    isDone   && "bg-primary text-white",
                    isActive && "bg-primary text-white ring-4 ring-primary/20 scale-110",
                    !isDone && !isActive && "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? "✓" : step.n}
                </div>
                {/* Right connector (hidden on last step) */}
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-300",
                    i === STEPS.length - 1 ? "invisible" : isDone ? "bg-primary" : "bg-gray-200"
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : isDone ? "text-primary/60" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
