import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { ViewKey } from '../types'
import { ChatIcon, VoiceIcon, GearIcon } from './Icons'

interface SidebarProps {
  activeView: ViewKey
  onViewChange: (view: ViewKey) => void
}

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ReactNode
}

const items: NavItem[] = [
  { key: 'chat', label: 'Chat', icon: <ChatIcon /> },
  { key: 'voice', label: 'Voz', icon: <VoiceIcon /> },
  { key: 'settings', label: 'Ajustes', icon: <GearIcon /> },
]

const btnBase =
  'flex items-center gap-2 transition-colors cursor-pointer outline-none'

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const desktopRef = useRef<HTMLElement>(null)
  const mobileRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const activeIndex = items.findIndex((i) => i.key === activeView)

  useEffect(() => {
    if (mobileRef.current && indicatorRef.current) {
      const mm = window.matchMedia('(prefers-reduced-motion: reduce)')
      gsap.to(indicatorRef.current, {
        x: activeIndex * (mobileRef.current.clientWidth / 3),
        duration: mm.matches ? 0 : 0.35,
        ease: 'power2.inOut',
      })
    }
  }, [activeIndex])

  return (
    <>
      <aside
        ref={desktopRef}
        className="hidden md:flex flex-col w-16 lg:w-48 shrink-0"
        style={{ background: 'var(--app-sidebar)', borderRight: '1px solid var(--app-border-subtle)' }}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b"
          style={{ borderColor: 'var(--app-border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--app-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--app-primary-text)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <span className="hidden lg:block text-sm font-semibold tracking-tight"
            style={{ color: 'var(--app-ink)' }}>ARES</span>
        </div>

        <nav className="flex-1 flex flex-col py-3 px-2 gap-1">
          {items.map((item) => {
            const isActive = activeView === item.key
            return (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className={`${btnBase} w-full px-3 py-2.5 text-sm rounded-lg transition-colors`}
                style={{
                  color: isActive ? 'var(--app-primary)' : 'var(--app-muted)',
                  background: isActive ? 'var(--app-primary-muted)' : 'transparent',
                }}
              >
                {item.icon}
                <span className="hidden lg:block text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-2 pb-3">
          <span className="hidden lg:block text-xs px-3 py-2.5"
            style={{ color: 'var(--app-muted)' }}>ARES v1.0</span>
        </div>
      </aside>

      <nav
        ref={mobileRef}
        className="md:hidden relative flex items-stretch h-14 shrink-0"
        style={{
          background: 'var(--app-sidebar)',
          borderTop: '1px solid var(--app-border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          ref={indicatorRef}
          className="absolute top-0 h-0.5 transition-none"
          style={{
            width: `${100 / 3}%`,
            background: 'var(--app-primary)',
          }}
        />
        {items.map((item) => {
          const isActive = activeView === item.key
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`${btnBase} relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors`}
              style={{ color: isActive ? 'var(--app-primary)' : 'var(--app-muted)' }}
            >
              {item.icon}
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
