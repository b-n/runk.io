import jwt from 'jsonwebtoken'

import { getSecret } from './secrets'

export interface Authorizer {
  getName: () => string
  checkAuthCode: (code: string, redirect_uri: string) => Promise<AuthResult>
  generateLoginUrl: () => Login
}

export interface Login {
  url: string
  parameters: Record<string, string>
}

interface SignOptions {
  expiresIn: number
}

export const sign = (payload: Record<string, any>, { expiresIn }: SignOptions): string =>
  jwt.sign(
    payload,
    getSecret('JWT_SECRET'),
    {
      expiresIn,
    }
  )

export const verify = (token: string) =>
  jwt.verify(
    token,
    getSecret('JWT_SECRET')
  )
