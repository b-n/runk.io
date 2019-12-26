import { CustomAuthorizerResult } from 'aws-lambda'
import jwt from 'jsonwebtoken'

import { getSecret } from './secrets'

const privateKey = getSecret('JWT_SECRET')

export const sign = (payload: any, { expiresIn }): string =>
  jwt.sign(
    payload,
    privateKey,
    {
      expiresIn,
    }
  )

export const verify = (token: string) =>
  jwt.verify(token, privateKey)

export const generatePolicy = (
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
