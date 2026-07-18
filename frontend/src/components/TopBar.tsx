import { Mic, Bell } from "lucide-react";

interface TopBarProps {
  mode?: 'buckets' | 'chat'
  onTalkModeClick?: () => void
}

export default function TopBar({ mode = 'buckets', onTalkModeClick }: TopBarProps) {
  return (
    <header className="w-full sticky top-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/10 flex items-center justify-between max-md:px-4 px-10 py-4">
      <div>
        <span className="font-display text-2xl font-semibold text-primary md:hidden">ARES AI</span>

        {mode === 'chat' ? (
          <div className="hidden md:flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>verified_user</span>
            </div>
            <span className="font-display text-2xl font-semibold text-primary">ARES AI</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-on-surface-variant/40">
            <span className="font-label text-sm">STORAGE</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            <span className="font-label text-sm text-on-surface">BUCKETS</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-on-surface-variant rounded-full hover:bg-white/5 active:scale-95 transition-all duration-200" aria-label="Notifications">
          <Bell size={18} />
        </button>

        {mode === 'chat' && onTalkModeClick && (
          <button
            onClick={onTalkModeClick}
            className="hidden md:flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-2 text-secondary text-sm font-medium transition-all duration-300 hover:bg-secondary/20 hover:border-secondary/40 active:scale-95"
          >
            <Mic size={16} />
            TALK MODE
          </button>
        )}
      </div>
    </header>
  )
}
