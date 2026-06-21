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
