export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type ViewKey = 'home' | 'chat' | 'buckets' | 'talkMode' | 'settings'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AskResponse {
  response: string
}
