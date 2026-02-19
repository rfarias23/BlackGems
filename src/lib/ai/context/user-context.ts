export interface UserContext {
  name: string
  role: string
  id: string
}

export function assembleUserContext(session: {
  user?: { id?: string; name?: string | null; role?: string }
}): UserContext {
  return {
    id: session.user?.id || '',
    name: session.user?.name || 'there',
    role: session.user?.role || 'FUND_ADMIN',
  }
}
