import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import Joi from '@hapi/joi'

import { update } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const user = async (event, _context) => {
  const { body } = event
  const { userId } = event.requestContext.authorizer

  if (!body) {
    return {
      statusCode: 400,
      body: { message: 'Request requires body' },
    }
  }

  const request = JSON.parse(body)

  const { value, error } = validate(request)

  if (error !== undefined) {
    return {
      statusCode: 400,
      body: {
        message: `Validate failures: ${error.details.map(error => error.message).join(', ')}`,
      },
    }
  }

  await updateUser(userId, value)

  return {
    statusCode: 204,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(user)

const validate = (request) => Joi.object({
  displayName: Joi.string().min(1),
  email: Joi.string().email(),
  pictureURL: Joi.string().uri(),
  locale: Joi.string(),
}).validate(
  request,
  { stripUnknown: true }
)

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
