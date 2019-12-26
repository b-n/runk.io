import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { withMiddleware } from '../services/middleware'

import { sign, generateLoginUrls, checkAuthCallback } from '../services/authorizer'
import { getUserIdFromAuthId, createUserFromAuth, updateAuth } from '../services/user'

const token = async (event) => {
  const { queryStringParameters } = event

  if (queryStringParameters == null || !queryStringParameters.code) {
    return {
      body: {
        message: 'Need authorizationCode parameter',
        loginUrls: generateLoginUrls(),
      },
      statusCode: 400,
    }
  }

  const result = await checkAuthCallback(queryStringParameters, 'GOOGLE')
  const { id, expiresIn } = result

  const authUserId = await getUserIdFromAuthId(id, 'GOOGLE')

  const userId = await (authUserId === null
    ? createUserFromAuth(result)
    : authUserId
  )

  const accessToken = sign({ userId: id }, { expiresIn })
  const refreshToken = sign({ userId: id, accessToken }, { expiresIn: '1y' })

  await updateAuth(userId, result, refreshToken)

  const response = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: refreshToken,
  }

  return {
    statusCode: 200,
    body: response,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(token)
