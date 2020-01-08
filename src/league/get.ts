import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { NotFound } from '../lib/errors'
import { query, safeProjection } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const league = async (event, _context) => {
  // TODO: Need to handle getByIds
  const { pathParameters } = event

  const { userId } = event.requestContext.authorizer

  const id = pathParameters && pathParameters.id

  if (id) {
    const league = await getById(id)
    console.log(id, league)

    if (!league) {
      throw new NotFound()
    }

    return {
      body: league,
      statusCode: 200,
    }
  }

  const leagues = await getByIds(id, userId)
  return {
    body: leagues,
    statusCode: 200,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(league)

const getById = async (leagueId: string): Promise<League> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'name', 'userCount', 'users'])

  return query({
    KeyConditionExpression: 'id = :leagueId',
    ExpressionAttributeNames,
    ExpressionAttributeValues: {
      ':leagueId': leagueId,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as League)
}

const getByIds = async (userId: string, sameUser: boolean): Promise<User> => {
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
