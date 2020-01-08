import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { query } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const user = async (event, _context) => {
  console.log(event)
  const { pathParameters } = event

  const { userId } = event.requestContext.authorizer

  const id = (pathParameters && pathParameters.id) || userId

  const user = await getById(id, id === userId)
  if (!user) {
    return {
      statusCode: 404,
      body: {
        message: `No user with Id ${id}`,
      },
    }
  }

  return {
    statusCode: 200,
    body: {
      ...user,
    },
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(user)

const getById = async (userId: string, sameUser: boolean): Promise<User> => {
  const projection = sameUser
    ? 'id,displayName,email,pictureURL,locale'
    : 'id,displayName,pictureURL'

  return query({
    KeyConditionExpression: 'id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    TableName: process.env.DB_TABLE_USER,
    ProjectionExpression: projection,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as User)
}
