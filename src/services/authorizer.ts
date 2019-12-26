import { sign, verify, generatePolicy } from './lib/auth'
import { getUserIdFromAuthId, createUserFromAuth, updateAuth } from './user'

import * as google from './lib/google'

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
  const { id, expiresIn } = result

  const authUserId = await getUserIdFromAuthId(id, authService.getName())

  const userId = await (authUserId === null
    ? createUserFromAuth(result)
    : authUserId
  )

  const accessToken = sign({ userId: id }, { expiresIn })
  const refreshToken = sign({ userId: id, accessToken }, { expiresIn: '1y' })

  return updateAuth(userId, result, refreshToken)
    .then(() => ({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken,
    }))
}

const getRefreshToken = async (): Promise<AuthToken> => {
  return null
}

export {
  sign,
  verify,
  getTokenFromAuthCode,
  getRefreshToken,
  generatePolicy,
  generateLoginUrls,
}
