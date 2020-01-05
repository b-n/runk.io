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
  jwt.verify(
    token,
    privateKey
  )
