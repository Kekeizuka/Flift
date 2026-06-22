import type { Equipment, MuscleGroup } from "@/lib/types";
import { normalizeMuscleGroup } from "@/lib/db/seed/normalize";
import type { IconProps } from "./IconBase";
import { HomeIcon, HistoryIcon, RoutinesIcon, ProgressIcon, SettingsIcon, ProfileIcon } from "./nav";
import {
  BarbellIcon,
  DumbbellIcon,
  KettlebellIcon,
  MachineIcon,
  CableIcon,
  BandIcon,
  BodyweightIcon,
} from "./equipment";
import { ChestIcon, BackIcon, LegsIcon, ShouldersIcon, ArmsIcon, CoreIcon } from "./muscles";
import {
  PlusIcon,
  MinusIcon,
  PlusCircleIcon,
  CheckIcon,
  EditIcon,
  TrashIcon,
  TimerIcon,
  PlateIcon,
  SwapIcon,
  PlayIcon,
  PauseIcon,
  ResetIcon,
  UndoIcon,
} from "./actions";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CloseIcon,
  SearchIcon,
  DownloadIcon,
  UploadIcon,
  MoreIcon,
  LayersIcon,
  TrendingUpIcon,
  TargetIcon,
  AdjustIcon,
  PaletteIcon,
  BellIcon,
  CalendarIcon,
} from "./ui";
import { BoltIcon, FlameIcon, TrophyIcon } from "./achievement";

const REGISTRY = {
  home: HomeIcon,
  history: HistoryIcon,
  routines: RoutinesIcon,
  progress: ProgressIcon,
  settings: SettingsIcon,
  profile: ProfileIcon,
  library: DumbbellIcon,
  barbell: BarbellIcon,
  dumbbell: DumbbellIcon,
  kettlebell: KettlebellIcon,
  machine: MachineIcon,
  cable: CableIcon,
  band: BandIcon,
  bodyweight: BodyweightIcon,
  chest: ChestIcon,
  back: BackIcon,
  legs: LegsIcon,
  shoulders: ShouldersIcon,
  arms: ArmsIcon,
  core: CoreIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  plusCircle: PlusCircleIcon,
  check: CheckIcon,
  edit: EditIcon,
  trash: TrashIcon,
  timer: TimerIcon,
  plate: PlateIcon,
  swap: SwapIcon,
  play: PlayIcon,
  pause: PauseIcon,
  reset: ResetIcon,
  undo: UndoIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronDown: ChevronDownIcon,
  close: CloseIcon,
  search: SearchIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  more: MoreIcon,
  layers: LayersIcon,
  trendingUp: TrendingUpIcon,
  target: TargetIcon,
  adjust: AdjustIcon,
  palette: PaletteIcon,
  bell: BellIcon,
  calendar: CalendarIcon,
  bolt: BoltIcon,
  flame: FlameIcon,
  trophy: TrophyIcon,
} as const;

export type IconName = keyof typeof REGISTRY;

/** Convenience registry component: `<Icon name="barbell" />`. */
export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const Cmp = REGISTRY[name];
  return <Cmp {...props} />;
}

const EQUIPMENT_ICON: Record<Equipment, IconName> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  machine: "machine",
  cable: "cable",
  bodyweight: "bodyweight",
  kettlebell: "kettlebell",
  band: "band",
  other: "plate",
};

const MUSCLE_ICON: Record<MuscleGroup, IconName> = {
  chest: "chest",
  back: "back",
  legs: "legs",
  shoulders: "shoulders",
  arms: "arms",
  core: "core",
};

export const equipmentIconName = (e: Equipment): IconName => EQUIPMENT_ICON[e] ?? "plate";

/** Tolerant of coarse groups, legacy fine tokens, and raw source muscle names. */
export const muscleIconName = (m: MuscleGroup | string): IconName => {
  const g = normalizeMuscleGroup(m) ?? (m as MuscleGroup);
  return MUSCLE_ICON[g] ?? "dumbbell";
};
