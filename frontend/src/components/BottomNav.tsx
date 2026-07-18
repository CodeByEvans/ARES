interface BottomNavProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="md:hidden flex justify-around items-center fixed bottom-0 left-0 right-0 z-50 bg-black backdrop-blur-2xl border-t border-white/10 py-4">
      <button
        onClick={() => onViewChange?.('chat')}
        className={`flex flex-col items-center gap-1 ${activeView === 'chat' ? 'text-primary' : 'text-on-surface-variant'}`}
      >
        <span className={`material-symbols-outlined ${activeView === 'chat' ? 'icon-fill' : ''}`}>chat_bubble</span>
        <span className="text-[10px] font-label">Chat</span>
      </button>

      <button
        onClick={() => onViewChange?.('buckets')}
        className={`flex flex-col items-center gap-1 ${activeView === 'buckets' ? 'text-primary' : 'text-on-surface-variant'}`}
      >
        <span className={`material-symbols-outlined ${activeView === 'buckets' ? 'icon-fill' : ''}`}>folder_special</span>
        <span className="text-[10px] font-label">Buckets</span>
      </button>

      <a href="#" className="flex flex-col items-center gap-1 text-on-surface-variant">
        <span className="material-symbols-outlined">settings_voice</span>
        <span className="text-[10px] font-label">Talk</span>
      </a>

      <a href="#" className="flex flex-col items-center gap-1 text-on-surface-variant">
        <span className="material-symbols-outlined">inventory_2</span>
        <span className="text-[10px] font-label">Archive</span>
      </a>
    </nav>
  )
}
