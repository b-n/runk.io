import 'source-map-support/register'
import { AuthorizerError } from '../lib/errors'
import { withMiddleware } from '../lib/middleware'
import { sign, verify } from '../lib/auth'

import * as google from '../lib/google'

import config from '../../config'

import userModel from '../models/user'
import authorizerModel from '../models/authorizer'

const authServices = {
  google,
}

const tokenHandler = async (event) => {
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

export const handler = withMiddleware(tokenHandler)

const generateLoginUrls = (services) =>
  Object.keys(services).reduce((accumulator, serviceName) => {
    accumulator[serviceName] = authServices[serviceName].generateLoginUrl()
    return accumulator
  }, {} as Record<string, string>)

const getTokenFromAuthCode = async ({ authorizationCode, authorizer }): Promise<AuthToken> => {
  const authService = authServices[authorizer]
  if (!authService) {
    throw new AuthorizerError(`Invalid authorizer: ${authorizer}`)
  }

  const authResult = await authService.checkAuthCode(authorizationCode)
  const userId = await authorizerModel.getUserIdByAuthId(
    authResult.id,
    authService.getName()
  )
  if (userId) {
    return generateTokens(userId)
  }

  const newUser = await userModel.createFromAuthResult(authResult)
  return generateTokens(newUser.id)
}

const getTokenFromRefreshToken = async ({ refreshToken }): Promise<AuthToken> => {
  const { userId } = verify(refreshToken)

  const user = await userModel.getById(userId)

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
  const refreshToken = sign({ userId, accessToken }, { expiresIn: '1y' })

  return userModel.updateRefreshToken(userId, refreshToken)
    .then(() => ({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken,
    }))
}
