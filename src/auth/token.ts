import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { withMiddleware } from '../services/middleware'

import { generateLoginUrls, getTokenFromAuthCode, getRefreshToken } from '../services/authorizer'

const supportedGrants = ['authorization_code', 'refresh_token']

const token = async (event) => {
  const { queryStringParameters } = event

  if (
    queryStringParameters == null ||
    !queryStringParameters.grant_type ||
    supportedGrants.indexOf(queryStringParameters.grant_type) === -1
  ) {
    return {
      body: {
        message: 'Unsupported grant_type',
        loginUrls: generateLoginUrls(),
      },
      statusCode: 400,
    }
  }

  const grantType = queryStringParameters.grant_type

  if (grantType === 'authorization_code') {
    return {
      body: await getTokenFromAuthCode(queryStringParameters),
      statusCode: 200,
    }
  }

  // must be refresh_token
  return {
    body: await getRefreshToken(queryStringParameters),
    statusCode: 200,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(token)
