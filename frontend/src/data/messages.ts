export interface Metric {
  icon: string
  label: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  metrics?: Metric[]
}

export const messages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Operational intelligence systems are online. I am ARES, your dedicated suite for strategic analysis and data processing. How shall we proceed today?',
    time: '09:41 AM',
  },
  {
    id: '2',
    role: 'user',
    content: 'Initialize a deep scan on the current project buckets. I need to synthesize the quarterly performance metrics into a strategic brief.',
    time: '09:42 AM',
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Scanning active buckets... Synthesis initialized. I\'ve identified three core vectors of growth:',
    time: '09:42 AM',
    metrics: [
      { icon: 'trending_up', label: 'Operational Efficiency: +12.4%' },
      { icon: 'database', label: 'Data Accuracy Index: 98.2%' },
    ],
  },
]
