import { IconBase, type IconProps } from "./IconBase";

/* Achievement glyphs. Emphasis comes from color + motion, not fill —
   keeping the whole set stroke-only and consistent. */

export const BoltIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5z" />
  </IconBase>
);

export const FlameIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 22c3.3 0 6-2.6 6-5.9 0-2.4-1.2-4.1-2.6-5.6-.4 1-1.2 1.6-2 1.9C14.2 9.6 13.8 6.4 11 3c-.4 3-2.2 4.6-3.6 6.5C6.1 11.4 6 13 6 16.1 6 19.4 8.7 22 12 22z" />
  </IconBase>
);

export const TrophyIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M8 4h8v4.5a4 4 0 0 1-8 0z" />
    <path d="M8 5.5H5.5A2.5 2.5 0 0 0 8 9" />
    <path d="M16 5.5h2.5A2.5 2.5 0 0 1 16 9" />
    <path d="M12 12.5v3" />
    <path d="M9 20h6l-.7-4.5h-4.6z" />
  </IconBase>
);
