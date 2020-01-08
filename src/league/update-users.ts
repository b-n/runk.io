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

  if (!body) {
    throw new BadInput('Request requires a body')
  }

  console.log(JSON.parse(body))
  const usersToMutate = validateRequest(
    JSON.parse(body),
    Joi.array().items(Joi.object({
      id: Joi.string().uuid().required(),
      isActive: Joi.boolean().required(),
      role: Joi.string().valid('admin', 'user'),
    })),
    { ErrorClass: BadInput }
  )

  const userMap = usersToMutate.reduce((a, c) => { a[c.id] = c; return a }, {})

  if (userMap[userId]) {
    throw new BadInput('Cannot update yourself with this command')
  }

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  const leagueUsers = league.users.filter(user => user.id === userId)

  if (leagueUsers.length === 0 || leagueUsers[0].role !== LeagueRole.admin) {
    throw new BadInput('You need to be part of the league and an admin to change users')
  }

  const newUserState = league.users.map(user => ({
    ...user,
    ...userMap[user.id],
  }))

  await updateLeagueUsers(newUserState, id)

  return {
    body: {
      ...league,
      users: newUserState,
    },
    statusCode: 200,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(league)

const getById = async (leagueId: string): Promise<League> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'users'])

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

const updateLeagueUsers = async (users: Array<LeagueUser>, leagueId: string): Promise<void> => {
  return update({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET userCount = :userCount,#users = :users',
    ExpressionAttributeNames: {
      '#users': 'users',
    },
    ExpressionAttributeValues: {
      ':users': users,
      ':userCount': users.filter(user => user.isActive).length,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}
