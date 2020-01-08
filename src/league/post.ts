import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import Joi from '@hapi/joi'
import uuidv4 from 'uuid/v4'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { query, put, safeProjection } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const league = async (event, _context) => {
  const { pathParameters, body } = event

  if (!body) {
    throw new BadInput('Requires a body')
  }

  const newLeague: League = validateRequest(
    JSON.parse(body),
    Joi.object({
      name: Joi.string().min(1).required(),
      inviteCode: Joi.string().allow(null).default(null),
    }),
    { ErrorClass: BadInput }
  )

  const { userId } = event.requestContext.authorizer

  const id = pathParameters && pathParameters.id

  if (id) {
    const existingLeague = await getById(id)

    if (!existingLeague) {
      throw new NotFound()
    }

    const leagueUsers = existingLeague.users.filter(user => user.id === userId)

    if (leagueUsers.length === 0) {
      throw new NotFound()
    }

    if (leagueUsers[0].role !== LeagueRole.admin) {
      throw new BadInput('User is not an admin of league')
    }

    const result = await putLeague({
      ...existingLeague,
      ...newLeague,
    })

    return {
      body: result,
      statusCode: 200,
    }
  }

  const leagues = await putLeague({
    ...newLeague,
    id: uuidv4(),
    isActive: true,
    userCount: 1,
    users: [{
      id: userId,
      role: LeagueRole.admin,
      isActive: true,
      score: 1000,
    }],
  })
  return {
    body: leagues,
    statusCode: 200,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(league)

const getById = async (leagueId: string): Promise<League> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'name', 'isActive', 'inviteCode', 'users'])

  return query({
    KeyConditionExpression: 'id = :leagueId',
    ExpressionAttributeValues: {
      ':leagueId': leagueId,
    },
    ExpressionAttributeNames,
    TableName: process.env.DB_TABLE_LEAGUE,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as League)
}

const putLeague = async (league: League): Promise<League> => {
  return put({
    Item: league,
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => league)
}
