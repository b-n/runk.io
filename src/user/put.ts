import 'source-map-support/register'
import Joi from '@hapi/joi'

import { BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { update } from '../repositories/user'

const user: Handler = async (event) => {
  const { body, requestContext } = event
  const { userId } = requestContext.authorizer

  if (!body) {
    return {
      statusCode: 400,
      body: { message: 'Request requires body' },
    }
  }

  const newUser = validateRequest(
    JSON.parse(body),
    Joi.object({
      displayName: Joi.string().min(1),
      email: Joi.string().email(),
      pictureURL: Joi.string().uri(),
      locale: Joi.string(),
    }),
    { ErrorClass: BadInput }
  )

  await update(userId, newUser)

  return {
    statusCode: 204,
  }
}

export const handler = withMiddleware(user)
