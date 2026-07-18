import { useState, useRef, useEffect } from "react";
import { User, Settings, LayoutDashboard } from "lucide-react";

interface UserMenuProps {
  onSettingsClick?: () => void
}

export default function UserMenu({ onSettingsClick }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative px-6 border-t border-white/5 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
          <User size={16} className="text-primary" />
        </div>
        <span className="text-sm text-on-surface font-medium">Evans Lituma</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl backdrop-blur-xl">
          <button
            onClick={() => { setOpen(false); onSettingsClick?.(); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
          >
            <LayoutDashboard size={16} />
            Open Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
