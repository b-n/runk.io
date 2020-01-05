import 'source-map-support/register'

import {
  withMiddleware,
  Handler,
} from '../services/middleware'
import {
  generateLoginUrls,
  getTokenFromAuthCode,
  getTokenFromRefreshToken,
} from '../services/authorizer'

import { AuthorizerError } from '../services/errors'

const token: Handler = async (event) => {
  const { queryStringParameters } = event

  if (
    queryStringParameters == null ||
    !queryStringParameters.grant_type
  ) {
    return {
      body: {
        loginUrls: generateLoginUrls(),
      },
      statusCode: 200,
    }
  }

  const grantType = queryStringParameters.grant_type

  try {
    switch (grantType) {
      case 'authorization_code':
        return {
          body: await getTokenFromAuthCode(queryStringParameters),
          statusCode: 200,
        }
      case 'refresh_token':
        return {
          body: await getTokenFromRefreshToken(queryStringParameters),
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
