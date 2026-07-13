import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { AppState } from '../types'

interface StateConfig {
  color: string
  scale: number
  pulse: boolean
}

function getStateConfig(state: AppState): StateConfig {
  return {
    idle: { color: 'var(--app-state-idle)', scale: 1, pulse: false },
    listening: { color: 'var(--app-state-listening)', scale: 1.15, pulse: true },
    thinking: { color: 'var(--app-state-thinking)', scale: 1, pulse: true },
    speaking: { color: 'var(--app-state-speaking)', scale: 1, pulse: true },
  }[state]
}

interface MicrophoneButtonProps {
  state: AppState
  onClick: () => void
  disabled?: boolean
}

export default function MicrophoneButton({ state, onClick, disabled = false }: MicrophoneButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const config = getStateConfig(state)

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    const tl = gsap.timeline()
    timelineRef.current = tl

    if (config.pulse && !reducedMotion.current) {
      tl.to(pulseRef.current, {
        scale: 1.6,
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        repeat: -1,
        repeatDelay: 0.3,
      })
    } else {
      gsap.set(pulseRef.current, { scale: 1, opacity: 0 })
    }

    if (reducedMotion.current) {
      ringRef.current!.style.borderColor = config.color
      buttonRef.current!.style.backgroundColor = config.color
      buttonRef.current!.style.transform = `scale(${config.scale})`
    } else {
      gsap.to(ringRef.current, {
        borderColor: config.color,
        duration: 0.4,
        ease: 'power2.out',
      })

      gsap.to(buttonRef.current, {
        scale: config.scale,
        backgroundColor: config.color,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
      })
    }

    return () => { tl.kill() }
  }, [state])

  const handleClick = () => {
    if (state === 'speaking') return
    if (reducedMotion.current) {
      onClick()
      return
    }
    const currentScale = getStateConfig(state).scale
    gsap.fromTo(
      buttonRef.current,
      { scale: currentScale * 0.85 },
      { scale: currentScale, duration: 0.3, ease: 'elastic.out(1, 0.4)' }
    )
    onClick()
  }

  return (
    <div className="relative flex items-center justify-center">
      <div
        ref={pulseRef}
        className="absolute w-20 h-20 rounded-full border-2"
        style={{ borderColor: config.color, opacity: 0 }}
      />
      <div
        ref={ringRef}
        className="absolute w-[88px] h-[88px] rounded-full border-2"
        style={{ borderColor: 'var(--app-border)' }}
      />
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: config.color }}
        aria-label={state === 'idle' ? 'Iniciar grabación' : 'Detener grabación'}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  )
}
