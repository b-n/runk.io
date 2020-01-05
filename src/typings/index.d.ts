interface User {
  id: string
  isActive: boolean
  email: string
  displayName: string
  locale: string
  pictureURL: string
  refreshToken?: string
  authorizers: {
    google?: UserAuthorizer
  }
}

interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

interface UserAuthorizer {
  id: string
  retrievedDate: string
}

interface AuthResult {
  authorizer: string
  id: string
  name: string
  email?: string
  locale?: string
  pictureURL?: string
}
