interface Match {
  id?: string
  leagueId: string
  date: string
  users: Record<string, MatchUser>
  winner: MatchTeam
}

interface MatchUser {
  id: string
  team: MatchTeam
  previousElo: number
  elo: number
}

type MatchTeam = number
