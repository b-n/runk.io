interface User {
  id: string
  email: string
  displayName: string
  locale: string
  pictureURL: string
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
  accessToken?: string
  tokenType?: string
  refreshToken?: string
  expires: string
  retrievedDate: string
}

interface AuthResult {
  authorizer: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  id: string
  name: string
  email?: string
  locale?: string
  pictureURL?: string
}
