import { IconBase, type IconProps } from "./IconBase";

/* Navigation glyphs. */

export const HomeIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.5 11.5 12 4l8.5 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M9.75 19.5V14h4.5v5.5" />
  </IconBase>
);

export const HistoryIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.2 9.5A9 9 0 1 1 3 13" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4.5l3 2" />
  </IconBase>
);

export const RoutinesIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="4.5" y="4" width="15" height="16" rx="2.5" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </IconBase>
);

export const ProgressIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 4v16h16" />
    <path d="M7.5 14l3-3.5 3 2.5 4-6" />
  </IconBase>
);

export const SettingsIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 7h9M16 7h5" />
    <circle cx="14" cy="7" r="2.4" />
    <path d="M3 17h5M12 17h9" />
    <circle cx="10" cy="17" r="2.4" />
  </IconBase>
);

export const ProfileIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </IconBase>
);
