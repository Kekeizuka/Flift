import { IconBase, type IconProps } from "./IconBase";

/* Utility / UI glyphs. */

export const ChevronLeftIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M15 5l-7 7 7 7" />
  </IconBase>
);

export const ChevronRightIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 5l7 7-7 7" />
  </IconBase>
);

export const ChevronDownIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 9l7 7 7-7" />
  </IconBase>
);

export const CloseIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </IconBase>
);

export const SearchIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </IconBase>
);

export const DownloadIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </IconBase>
);

export const UploadIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 21V9" />
    <path d="M7 14l5-5 5 5" />
    <path d="M5 3h14" />
  </IconBase>
);

export const MoreIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
  </IconBase>
);

export const LayersIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </IconBase>
);

export const TrendingUpIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M16 7h5v5" />
  </IconBase>
);

export const TargetIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
  </IconBase>
);

export const AdjustIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 6h14M5 12h14M5 18h14" />
    <circle cx="9" cy="6" r="2" fill="var(--color-surface)" />
    <circle cx="15" cy="12" r="2" fill="var(--color-surface)" />
    <circle cx="8" cy="18" r="2" fill="var(--color-surface)" />
  </IconBase>
);

export const PaletteIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-1 2-2s-.5-1.4-.5-2 .7-1 1.5-1H17a4 4 0 0 0 4-4c0-3.9-4-6-9-6z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
  </IconBase>
);

export const BellIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </IconBase>
);

export const CalendarIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="4" y="5" width="16" height="16" rx="2.5" />
    <path d="M4 9h16M8 3v4M16 3v4" />
  </IconBase>
);
