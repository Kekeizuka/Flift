import { IconBase, type IconProps } from "./IconBase";

/* Equipment glyphs — shared line language with the rest of the family. */

export const BarbellIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 12h18" />
    <path d="M4 9.5v5" />
    <path d="M6.5 7.5v9" />
    <path d="M17.5 7.5v9" />
    <path d="M20 9.5v5" />
  </IconBase>
);

export const DumbbellIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9.5 12h5" />
    <path d="M6.5 8.5v7" />
    <path d="M8.5 10v4" />
    <path d="M15.5 10v4" />
    <path d="M17.5 8.5v7" />
  </IconBase>
);

export const KettlebellIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 8a3 3 0 0 1 6 0" />
    <path d="M9.2 8C6.8 9.6 6 12.5 6.5 15.5A3 3 0 0 0 9.5 19h5a3 3 0 0 0 3-3.5c.5-3-.3-5.9-2.7-7.5" />
  </IconBase>
);

export const MachineIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5.5 4v16" />
    <path d="M5.5 8h6a5 5 0 0 1 5 5v1" />
    <rect x="14.5" y="14.5" width="5" height="5" rx="1" />
  </IconBase>
);

export const CableIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="6" r="2.5" />
    <path d="M12 8.5v4" />
    <path d="M9.5 15.5h5l-1.2 4h-2.6z" />
  </IconBase>
);

export const BandIcon = (p: IconProps) => (
  <IconBase {...p}>
    <ellipse cx="12" cy="12" rx="4" ry="8" />
    <path d="M8.5 7.5l-3.5-2M8.5 16.5l-3.5 2" />
    <path d="M15.5 7.5l3.5-2M15.5 16.5l3.5 2" />
  </IconBase>
);

export const BodyweightIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="5.5" r="2.5" />
    <path d="M12 8v6" />
    <path d="M6.5 10.5l5.5 1.5 5.5-1.5" />
    <path d="M8.5 20l3.5-6 3.5 6" />
  </IconBase>
);
