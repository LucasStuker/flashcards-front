import {
  CalendarDays,
  ChartColumn,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  FileUp,
  Flame,
  Folder,
  House,
  Layers,
  ListChecks,
  type LucideIcon,
  Menu,
  Plus,
  Repeat,
  Target,
  Timer,
  X,
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
  checklist: ListChecks,
  upload: FileUp,
  plus: Plus,
  close: X,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof icones;

export function NavIcon({ name, className = "h-4 w-4" }: { name: NavIconName; className?: string }) {
  const Icone = icones[name];
  return <Icone aria-hidden="true" strokeWidth={1.75} className={`shrink-0 ${className}`} />;
}
