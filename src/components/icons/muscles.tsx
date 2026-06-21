import { IconBase, type IconProps } from "./IconBase";

/* Muscle-group glyphs — symbolic, kept distinct and legible at 24px. */

export const ChestIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 8C10.5 6 7 5.5 5 7.5c-1.8 1.8-1 5 1.5 6.2C9 14.8 11.5 13 12 10" />
    <path d="M12 8c1.5-2 5-2.5 7-.5 1.8 1.8 1 5-1.5 6.2C15 14.8 12.5 13 12 10" />
    <path d="M12 8v3" />
  </IconBase>
);

export const BackIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 4h6l-1 5 2.5 5.5L15 20H9l-1.5-5.5L10 9z" />
    <path d="M12 4.5v15" />
  </IconBase>
);

export const LegsIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M8.5 4h7" />
    <path d="M9 4.5l-.5 8L7 20" />
    <path d="M15 4.5l.5 8L17 20" />
    <path d="M8.7 11h6.6" />
  </IconBase>
);

export const ShouldersIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4.5 14a7.5 7.5 0 0 1 15 0" />
    <circle cx="4.5" cy="13.5" r="2.5" />
    <circle cx="19.5" cy="13.5" r="2.5" />
  </IconBase>
);

export const ArmsIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 6h5a4 4 0 0 1 4 4v1a4 4 0 0 0 5 4" />
    <path d="M9 6.5v3a3.5 3.5 0 0 0 3.5 3.5" />
  </IconBase>
);

export const CoreIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="7.5" y="4" width="9" height="16" rx="3.5" />
    <path d="M12 4.5v15M8 9.5h8M8 14.5h8" />
  </IconBase>
);
