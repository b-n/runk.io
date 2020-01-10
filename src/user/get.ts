import 'source-map-support/register'

import { NotFound } from '../lib/errors'
import { query, safeProjection } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const user = async (event, _context) => {
  const { pathParameters, requestContext } = event
  const { userId } = requestContext.authorizer

  const id = (pathParameters && pathParameters.id) || userId

  const user = await getById(id, id === userId)
  if (!user) {
    throw new NotFound()
  }

  return {
    statusCode: 200,
    body: {
      ...user,
    },
  }
}

export const handler = withMiddleware(user)

const getById = async (userId: string, sameUser: boolean): Promise<User> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(sameUser
    ? ['id', 'displayName', 'email', 'pictureURL', 'locale']
    : ['id', 'displayName', 'pictureURL'])

  return query({
    KeyConditionExpression: 'id = :userId',
    ExpressionAttributeNames,
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    TableName: process.env.DB_TABLE_USER,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as User)
}
