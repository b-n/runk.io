import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'

import { generatePolicy, verify } from '../services/authorizer'

const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  const { authorizationToken } = event
  if (!authorizationToken) {
    throw new Error('Unauthorized')
  }

  const [tokenType, token] = authorizationToken.split(' ')

  if (tokenType !== 'Bearer' || !token) {
    throw new Error('Unauthorized')
  }

  try {
    const context = verify(token)
    return generatePolicy(context.userId, 'Allow', '*', context)
  } catch (e) {
    throw new Error('Unauthorized')
  }
}

export {
  handler,
}
