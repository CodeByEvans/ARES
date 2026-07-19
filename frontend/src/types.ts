export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type ViewKey = 'home' | 'chat' | 'buckets' | 'talkMode' | 'settings'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AskResponse {
  response: string
}

export interface B2File {
  id: string
  name: string
  size: number
  content_type: string
  uploaded: string
  action: string
}

export interface ProjectFolder {
  name: string
  file_count: number
  total_size: number
}

export interface FolderData {
  files: B2File[]
  file_count: number
  total_size: number
}

export interface ArchivesData {
  files: B2File[]
  folders?: string[]
  file_count: number
}

export interface BucketsData {
  projects: ProjectFolder[]
  prompts: FolderData
  archives: ArchivesData
}
