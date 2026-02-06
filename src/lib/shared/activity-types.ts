export interface TimelineEvent {
  id: string
  kind: 'activity' | 'system'
  type: string
  title: string
  description: string | null
  userId: string | null
  userName: string | null
  createdAt: Date
}
