import { IconBase, type IconProps } from "./IconBase";

/* Action glyphs. */

export const PlusIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);

export const MinusIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12h14" />
  </IconBase>
);

export const PlusCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.5v7M8.5 12h7" />
  </IconBase>
);

export const CheckIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </IconBase>
);

export const EditIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 20h4L19.5 8.5l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </IconBase>
);

export const TrashIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </IconBase>
);

export const TimerIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9.5 3h5" />
    <path d="M18.5 6.5l1.5-1.5" />
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5V9" />
  </IconBase>
);

export const PlateIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.5" />
  </IconBase>
);

export const SwapIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 8h13" />
    <path d="M14 5l3 3-3 3" />
    <path d="M20 16H7" />
    <path d="M10 13l-3 3 3 3" />
  </IconBase>
);

export const PlayIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M7 5.5l11 6.5-11 6.5z" />
  </IconBase>
);

export const PauseIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 5v14M15 5v14" />
  </IconBase>
);

export const ResetIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.5 4v5h5" />
    <path d="M4 13a8 8 0 1 0 2.3-7.3L3.5 9" />
  </IconBase>
);

export const UndoIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 7L4.5 11.5 9 16" />
    <path d="M4.5 11.5H14a5.5 5.5 0 0 1 0 11h-1.5" />
  </IconBase>
);
