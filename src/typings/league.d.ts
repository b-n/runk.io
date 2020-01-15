interface League {
  id?: string
  displayName: string
  pictureURL: string
  isActive?: boolean
  inviteCode: string
  userCount?: number
  users?: Array<LeagueUser>
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
