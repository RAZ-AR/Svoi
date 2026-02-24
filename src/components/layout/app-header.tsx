// Svoi — App top header: logo + notifications (minimal)
import Link from "next/link";
import { Bell } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  rightSlot?: React.ReactNode;
}

export function AppHeader({
  title,
  showLogo = true,
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      {showLogo ? (
        <Link href="/home" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Svoi
          </span>
          <span className="text-xs text-gray-400 font-normal">
            Свой базар
          </span>
        </Link>
      ) : (
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      )}

      <div className="flex items-center gap-2">
        {rightSlot}
        <Link
          href="/notifications"
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <Bell size={20} className="text-gray-500" />
        </Link>
      </div>
    </header>
  );
}
