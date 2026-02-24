// Svoi — App top header: large title left + action buttons right
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
    <header className="flex items-start justify-between px-5 pb-2 pt-5">
      {showLogo ? (
        <Link href="/home" className="flex flex-col">
          <span className="text-[28px] font-black leading-tight tracking-tight text-[#1A1A1A]">
            Svoi
          </span>
          <span className="text-xs text-[#A89070] font-medium -mt-0.5">
            Свой базар
          </span>
        </Link>
      ) : (
        <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#1A1A1A]">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2 mt-1">
        {rightSlot}
        <Link
          href="/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-colors active:bg-[#EDE8E2]"
        >
          <Bell size={18} className="text-[#1A1A1A]" />
        </Link>
      </div>
    </header>
  );
}
