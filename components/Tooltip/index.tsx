"use client";

import { classNames } from "@/lib/utils";
import type { ReactNode } from "react";
import { useState, useId } from "react";

const Tooltip = ({
  children,
  content,
  className,
  placement = "top",
  delay = 200,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const tooltipId = `tooltip-${id}`;

  const showTooltip = () => {
    const timer = setTimeout(() => setVisible(true), delay);
    return timer;
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  const placementClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 pb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 pt-2",
    left: "right-full top-1/2 -translate-y-1/2 pr-2",
    right: "left-full top-1/2 -translate-y-1/2 pl-2",
  }[placement];

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-100 border-l-transparent border-r-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-100 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-100 border-t-transparent border-b-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-100 border-t-transparent border-b-transparent border-l-transparent",
  }[placement];

  return (
    <div className={classNames("relative inline-block", className)}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={visible ? tooltipId : undefined}
        className="inline-block"
      >
        {children}
      </div>
      <div
        id={tooltipId}
        role="tooltip"
        className={classNames(
          "pointer-events-none absolute z-50 flex items-center justify-center",
          "transition-all duration-200 ease-out",
          placementClasses,
          visible
            ? "opacity-100 scale-100 translate-y-0 translate-x-0"
            : "opacity-0 scale-95"
        )}
        style={{
          transitionProperty: "opacity, transform",
          willChange: "opacity, transform",
        }}
      >
        <span
          className={classNames(
            "relative px-3 py-1.5 text-sm font-medium text-white",
            "bg-slate-900 dark:bg-slate-100 dark:text-slate-900",
            "rounded-lg shadow-lg",
            "max-w-xs whitespace-nowrap"
          )}
        >
          {content}
          {/* Arrow */}
          <span
            className={classNames("absolute w-0 h-0", "border-4", arrowClasses)}
            style={{
              filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))",
            }}
          />
        </span>
      </div>
    </div>
  );
};

export type TooltipProps = {
  children: ReactNode;
  /** Display text */
  content: string;
  /** Position */
  placement?: "top" | "bottom" | "left" | "right";
  /** Additional styling */
  className?: string;
  /** Delay in milliseconds before showing tooltip */
  delay?: number;
};

export default Tooltip;
