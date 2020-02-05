interface League {
  id?: string
  displayName: string
  pictureURL: string
  description: string
  isActive?: boolean
  inviteCode: string
  userCount?: number
  users?: {
    [key: string]: LeagueUser
  }
}

interface LeagueUser {
  id?: string
  displayName: string
  pictureURL: string
  score: number
  isActive: boolean
  role: LeagueRole
}

declare const enum LeagueRole {
  member = 'member',
  admin = 'admin',
}
