import { sign, verify, generatePolicy } from './lib/auth'
import {
  getUserIdFromAuthId,
  getById,
  createUserFromAuth,
  updateRefreshToken,
} from './user'

import * as google from './lib/google'

import config from '../../config'

const generateLoginUrls = () => ({
  google: google.generateLoginUrl(),
})

const getTokenFromAuthCode = async ({ code, state }): Promise<AuthToken> => {
  const authorizer = state
  if (authorizer !== 'GOOGLE') {
    throw new Error('Invalid authorizer')
  }

  const authService = google

  const result = await authService.checkAuthCode(code)
  const { id } = result

  const authUserId = await getUserIdFromAuthId(id, authService.getName())

  const userId = await (authUserId === null
    ? createUserFromAuth(result)
    : authUserId
  )

  return generateTokens(userId)
}

const getTokenFromRefreshToken = async ({ refresh_token }): Promise<AuthToken> => {
  const { userId } = verify(refresh_token)

  const user = await getById(userId)

  if (
    !user ||
    user.refreshToken !== refresh_token
  ) {
    throw new Error('Invalid refresh token')
  }

  if (!user.isActive) {
    throw new Error('Unauthorized')
  }

  return generateTokens(user.id)
}

const generateTokens = async (userId: string): Promise<AuthToken> => {
  const expiresIn = config.tokenExpiry
  const accessToken = sign({ userId }, { expiresIn })
  const refreshToken = sign({ userId, accessToken }, { expiresIn: '1y' })

  return updateRefreshToken(userId, refreshToken)
    .then(() => ({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken,
    }))
}

export {
  sign,
  verify,
  getTokenFromAuthCode,
  getTokenFromRefreshToken,
  generatePolicy,
  generateLoginUrls,
}
