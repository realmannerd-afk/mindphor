import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  description: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  description,
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={cn(
        "relative flex flex-col justify-end overflow-hidden rounded-[20px] bg-bg-subtle border border-border-default p-8",
        className,
      )}
    >
      {background && <div className="absolute inset-0 z-0">{background}</div>}
      
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-text-primary">
          {name}
        </h3>
        <p className="text-text-secondary leading-relaxed max-w-lg">{description}</p>
      </div>
    </div>
  );
}
