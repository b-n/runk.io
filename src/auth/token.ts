import 'source-map-support/register'
import { AuthorizerError } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'
import { sign, verify, Authorizer } from '../lib/auth'

import * as google from '../lib/google'

import config from '../../config'

import {
  getById,
  createFromAuthResult,
  update,
} from '../repositories/user'
import { getUserIdByAuthId } from '../repositories/authorizer'

const authServices: Record<string, Authorizer> = {
  google,
}

const token: Handler = async (event) => {
  const { queryStringParameters } = event

  if (
    queryStringParameters == null ||
    !queryStringParameters.grant_type
  ) {
    return {
      body: {
        loginUrls: generateLoginUrls(authServices),
      },
      statusCode: 200,
    }
  }

  const { grant_type, refresh_token, code, state } = queryStringParameters

  try {
    switch (grant_type) {
      case 'authorization_code':
        if (!code || !state) {
          throw new AuthorizerError('Requires both code and state')
        }
        return {
          body: await getTokenFromAuthCode({ authorizationCode: code, authorizer: state.toLowerCase() }),
          statusCode: 200,
        }
      case 'refresh_token':
        if (!refresh_token) {
          throw new AuthorizerError('Requires a refresh token')
        }
        return {
          body: await getTokenFromRefreshToken({ refreshToken: refresh_token }),
          statusCode: 200,
        }
      default:
        return {
          body: {
            message: 'invalid grant_type',
          },
          statusCode: 400,
        }
    }
  } catch (e) {
    if (e instanceof AuthorizerError) {
      return {
        body: {
          message: e.message,
        },
        statusCode: 400,
      }
    }
    throw e
  }
}

export const handler = withMiddleware(token)

const generateLoginUrls = (services: Record<string, Authorizer>): Record<string, string> =>
  Object.keys(services).reduce((accumulator, serviceName) => {
    accumulator[serviceName] = authServices[serviceName].generateLoginUrl()
    return accumulator
  }, {} as Record<string, string>)

const getTokenFromAuthCode = async (
  { authorizationCode, authorizer }: { authorizationCode: string; authorizer: string }
): Promise<AuthToken> => {
  const authService = authServices[authorizer]
  if (!authService) {
    throw new AuthorizerError(`Invalid authorizer: ${authorizer}`)
  }

  const authResult = await authService.checkAuthCode(authorizationCode)
  const userId = await getUserIdByAuthId(
    authResult.id,
    authService.getName()
  )
  if (userId) {
    return generateTokens(userId)
  }

  const newUser = await createFromAuthResult(authResult)
  return generateTokens(newUser.id)
}

const getTokenFromRefreshToken = async (
  { refreshToken }: { refreshToken: string }
): Promise<AuthToken> => {
  const { userId } = verify(refreshToken) as any

  const user = await getById(userId, { projection: ['id', 'isActive', 'refreshToken'] })

  if (
    !user ||
    user.refreshToken !== refreshToken
  ) {
    throw new AuthorizerError('Invalid refresh token')
  }

  if (!user.isActive) {
    throw new AuthorizerError('Unauthorized')
  }

  return generateTokens(user.id)
}

const generateTokens = async (userId: string): Promise<AuthToken> => {
  const expiresIn = config.tokenExpiry
  const accessToken = sign({ userId }, { expiresIn })
  const refreshToken = sign({ userId, accessToken }, { expiresIn: 86400 * 365 })

  return update(userId, { refreshToken })
    .then(() => ({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken,
    }))
}
