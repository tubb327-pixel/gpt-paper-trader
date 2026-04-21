import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function Card({ title, children, className, headerRight }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#12121a] border border-[#1f1f2e] flex flex-col",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f2e]">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8b8b9a]">
            {title}
          </span>
          {headerRight}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
