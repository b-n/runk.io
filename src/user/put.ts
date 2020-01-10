import 'source-map-support/register'
import Joi from '@hapi/joi'

import { BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { update } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const user = async (event, _context) => {
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

  await updateUser(userId, newUser)

  return {
    statusCode: 204,
  }
}

export const handler = withMiddleware(user)

const updateUser = async (userId: string, values: Record<string, any>): Promise<void> => {
  return update({
    Key: {
      id: userId,
    },
    UpdateExpression: `SET ${Object.keys(values).map(a => `#${a} = :${a}`).join(',')}`,
    ExpressionAttributeNames: Object.keys(values).reduce(
      (a, c) => { a['#' + c] = c; return a },
      {}
    ),
    ExpressionAttributeValues: Object.keys(values).reduce(
      (a, c) => { a[':' + c] = values[c]; return a },
      {}
    ),
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => null)
}
