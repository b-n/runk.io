import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import Joi from '@hapi/joi'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { query, update, safeProjection } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const league = async (event, _context) => {
  const { pathParameters, body } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  const suppliedInviteCode = validateRequest(
    body ? JSON.parse(body) : {},
    Joi.object({
      inviteCode: Joi.string().allow(null).default(null),
    }),
    { ErrorClass: BadInput }
  ).inviteCode

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  if (league.inviteCode !== null && suppliedInviteCode !== league.inviteCode) {
    throw new BadInput('inviteCode does not match the league')
  }

  const leagueUsers = league.users.filter(user => user.id === userId)

  if (leagueUsers.length !== 0) {
    throw new BadInput('Already joined the league')
  }

  await addUserToLeague(
    {
      id: userId,
      role: LeagueRole.member,
      isActive: true,
      score: 1000,
    },
    id
  )

  return {
    statusCode: 204,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(league)

const getById = async (leagueId: string): Promise<League> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'inviteCode', 'users'])

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

const addUserToLeague = async (leagueUser: LeagueUser, leagueId: string): Promise<void> => {
  return update({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET userCount = userCount + :increment,#users = list_append(#users, :user)',
    ExpressionAttributeNames: {
      '#users': 'users',
    },
    ExpressionAttributeValues: {
      ':user': [leagueUser],
      ':increment': 1,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}
