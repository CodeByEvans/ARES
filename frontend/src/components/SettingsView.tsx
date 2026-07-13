import { useState } from 'react'

export default function SettingsView() {
  const [language, setLanguage] = useState('es')
  const [voiceModel, setVoiceModel] = useState('default')

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-lg mx-auto w-full">
      <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--app-ink)' }}>
        Ajustes
      </h2>

      <div className="space-y-5">
        <section>
          <h3
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--app-muted)' }}
          >
            Idioma
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className="text-sm px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer"
                style={{
                  background: language === opt.value ? 'var(--app-primary-muted)' : 'var(--app-surface)',
                  borderColor: language === opt.value ? 'var(--app-primary)' : 'var(--app-border)',
                  color: language === opt.value ? 'var(--app-primary)' : 'var(--app-ink-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--app-muted)' }}
          >
            Voz
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'default', label: 'Por defecto' },
              { value: 'natural', label: 'Natural' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVoiceModel(opt.value)}
                className="text-sm px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer"
                style={{
                  background: voiceModel === opt.value ? 'var(--app-primary-muted)' : 'var(--app-surface)',
                  borderColor: voiceModel === opt.value ? 'var(--app-primary)' : 'var(--app-border)',
                  color: voiceModel === opt.value ? 'var(--app-primary)' : 'var(--app-ink-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--app-muted)' }}
          >
            Acerca de
          </h3>
          <div
            className="rounded-lg px-4 py-3 text-sm space-y-1.5"
            style={{ background: 'var(--app-surface)', color: 'var(--app-ink-secondary)' }}
          >
            <div className="flex justify-between">
              <span>Versión</span>
              <span style={{ color: 'var(--app-ink)' }}>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Modelo</span>
              <span style={{ color: 'var(--app-ink)' }}>llama3.2</span>
            </div>
            <div className="flex justify-between">
              <span>TTS</span>
              <span style={{ color: 'var(--app-ink)' }}>es-MX DaliaNeural</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
