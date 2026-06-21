import * as React from "react";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  size?: number;
}

/**
 * Shared chassis for the custom RepLog icon family. One visual language:
 * 24×24 grid, stroke-only, `currentColor`, weight 2, round caps & joins.
 */
export function IconBase({
  size = 24,
  strokeWidth = 2,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
