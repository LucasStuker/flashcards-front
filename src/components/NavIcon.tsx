import {
  CalendarDays,
  ChartColumn,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  Flame,
  Folder,
  House,
  Layers,
  type LucideIcon,
  Menu,
  Repeat,
  Target,
  Timer,
} from "lucide-react";

const icones = {
  home: House,
  chart: ChartColumn,
  calendar: CalendarDays,
  timer: Timer,
  cards: Layers,
  target: Target,
  folder: Folder,
  chevrons: ChevronsUpDown,
  "chevron-right": ChevronRight,
  check: CircleCheck,
  flame: Flame,
  repeat: Repeat,
  menu: Menu,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof icones;

export function NavIcon({ name, className = "h-4 w-4" }: { name: NavIconName; className?: string }) {
  const Icone = icones[name];
  return <Icone aria-hidden="true" strokeWidth={1.75} className={`shrink-0 ${className}`} />;
}
