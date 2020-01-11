import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import { verify } from '../lib/auth'

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
    const context = verify(token) as any
    return generatePolicy(context.userId, 'Allow', '*', context)
  } catch (e) {
    throw new Error('Unauthorized')
  }
}

const generatePolicy = (
  principalId: string,
  Effect: string,
  Resource: string,
  context: Record<string, any>
): CustomAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect,
        Resource,
      },
    ],
  },
  context,
})

export {
  handler,
}
