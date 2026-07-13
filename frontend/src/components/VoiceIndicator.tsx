import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { AppState } from '../types'

interface VoiceIndicatorProps {
  state: AppState
  micAnalyserRef?: React.RefObject<AnalyserNode | null>
  error?: string | null
}

const labels: Record<AppState, string> = {
  idle: 'Di "Despierta Ares"...',
  listening: 'Escuchando...',
  thinking: 'Procesando...',
  speaking: 'Respondiendo...',
}

function getBarColor(state: AppState): string {
  switch (state) {
    case 'listening': return 'var(--app-state-listening)'
    case 'thinking': return 'var(--app-state-thinking)'
    case 'speaking': return 'var(--app-state-speaking)'
    default: return 'var(--app-state-idle)'
  }
}

const barHeights = [
  [40, 60, 40],
  [20, 80, 20],
  [50, 50, 50],
  [30, 70, 30],
  [40, 60, 40],
  [20, 80, 20],
  [50, 50, 50],
  [30, 70, 30],
]

export default function VoiceIndicator({ state, micAnalyserRef, error }: VoiceIndicatorProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const labelRef = useRef<HTMLSpanElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const rafRef = useRef<number>(0)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const isAnimating = state !== 'idle'

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    cancelAnimationFrame(rafRef.current)

    if (reducedMotion.current) {
      barsRef.current.forEach((bar) => {
        if (bar) {
          bar.style.height = isAnimating ? '48px' : '16px'
          bar.style.transition = 'height 0.3s'
        }
      })
    } else if (state === 'listening' && micAnalyserRef?.current) {
      const analyser = micAnalyserRef.current
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const binSize = Math.floor(dataArray.length / 8)

      const update = () => {
        analyser.getByteFrequencyData(dataArray)
        for (let i = 0; i < 8; i++) {
          let sum = 0
          for (let j = 0; j < binSize; j++) {
            sum += dataArray[i * binSize + j] || 0
          }
          const level = Math.min(1, sum / binSize / 200)
          const height = 16 + level * 48
          const bar = barsRef.current[i]
          if (bar) {
            gsap.to(bar, {
              height,
              duration: 0.08,
              ease: 'power2.out',
            })
          }
        }
        rafRef.current = requestAnimationFrame(update)
      }
      rafRef.current = requestAnimationFrame(update)
    } else if (isAnimating && barsRef.current.length > 0) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.1 })
      barsRef.current.forEach((bar, i) => {
        const heights = barHeights[i % barHeights.length]!
        tl.to(
          bar,
          {
            height: heights[Math.floor(Math.random() * heights.length)],
            duration: 0.3 + Math.random() * 0.2,
            ease: 'power2.inOut',
          },
          i * 0.05,
        )
      })
      timelineRef.current = tl
    } else {
      barsRef.current.forEach((bar) => {
        gsap.to(bar, { height: 16, duration: 0.3 })
      })
    }

    if (reducedMotion.current) {
      labelRef.current!.style.opacity = '1'
      labelRef.current!.style.transform = 'none'
    } else {
      gsap.fromTo(
        labelRef.current,
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.3 },
      )
    }

    return () => {
      if (timelineRef.current) timelineRef.current.kill()
      cancelAnimationFrame(rafRef.current)
    }
  }, [state, isAnimating, micAnalyserRef])

  const barColor = getBarColor(state)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1.5 h-16" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el
            }}
            className="w-1.5 rounded-full transition-colors"
            style={{ height: 16, background: barColor }}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span
          ref={labelRef}
          className="text-sm transition-opacity"
          style={{ color: 'var(--app-muted)' }}
          aria-live="polite"
          role="status"
        >
          {labels[state] || labels.idle}
        </span>
        {error && (
          <span
            className="text-xs"
            style={{ color: 'var(--app-state-error)' }}
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
