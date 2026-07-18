import { MessageCircle, FolderOpen } from "lucide-react";
import NewSessionButton from "./NewSessionButton";
import UserMenu from "./UserMenu";

interface SideNavProps {
  activeView?: 'home' | 'chat' | 'buckets' | 'talkMode' | 'settings'
  onViewChange?: (view: string) => void
  onSettingsClick?: () => void
}

const activeStyle: React.CSSProperties = {
  background: 'rgba(184, 195, 255, 0.12)',
  color: '#b8c3ff',
  borderRight: '2px solid #b8c3ff',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  fontWeight: 500,
}

const inactiveStyle: React.CSSProperties = {
  color: 'var(--color-on-surface-variant)',
}

export default function SideNav({ activeView, onViewChange, onSettingsClick }: SideNavProps) {
  return (
    <nav className="h-screen w-64 fixed left-0 top-0 z-50 hidden md:flex flex-col py-8 border-r border-white/10 bg-black/40 backdrop-blur-3xl">
      <div className="px-8 mb-6">
        <h1 className="font-display text-5xl font-bold leading-tight tracking-tighter text-primary">ARES</h1>
        <p className="font-body text-base text-on-surface-variant opacity-60">Intelligence Suite</p>
      </div>

      <NewSessionButton />

      <div className="flex-1 flex flex-col gap-1 px-4">
        <button
          onClick={() => onViewChange?.('chat')}
          style={activeView === 'chat' ? activeStyle : inactiveStyle}
          className="flex w-full items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out rounded-xl hover:bg-white/5 hover:text-on-surface"
        >
          <MessageCircle size={18} />
          <span className="text-sm">Chat</span>
        </button>

        <button
          onClick={() => onViewChange?.('buckets')}
          style={activeView === 'buckets' ? activeStyle : inactiveStyle}
          className="flex w-full items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out rounded-xl hover:bg-white/5 hover:text-on-surface"
        >
          <FolderOpen size={18} />
          <span className="text-sm">Buckets</span>
        </button>
      </div>

      <UserMenu onSettingsClick={onSettingsClick} />
    </nav>
  )
}
