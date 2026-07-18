import type { AskResponse } from '../types'
import type { Message } from '../types'

const API_BASE = '/api'

export async function talk(prompt: string, history: Message[] = []): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/talk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history }),
  })
  if (!res.ok) throw new Error('Talk failed')
  return res.json() as Promise<AskResponse>
}

export async function chat(prompt: string, history: Message[] = []): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history }),
  })
  if (!res.ok) throw new Error('Chat failed')
  return res.json() as Promise<AskResponse>
}

export async function getSessionHistory(): Promise<{ history: Message[] }> {
  const res = await fetch(`${API_BASE}/sessions/history`)
  if (!res.ok) throw new Error('Session history failed')
  return res.json() as Promise<{ history: Message[] }>
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('TTS failed')
  return res.blob()
}
