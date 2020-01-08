import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { query, update, safeProjection } from '../lib/dynamo'
import { withMiddleware } from '../lib/middleware'

const league = async (event, _context) => {
  const { pathParameters } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  if (league.users.filter(user => user.id === userId).length === 0) {
    throw new BadInput('You cannot leave a league you were not part of')
  }

  const leagueAdmins = league.users.filter(user => user.role === LeagueRole.admin)

  if (leagueAdmins.length === 1 && leagueAdmins[0].id === userId) {
    throw new BadInput('The last admin cannot abandon a league. Delete it instead')
  }

  const newLeagueUsers = league.users.filter(user => user.id !== userId)

  await removeUserFromLeague(
    newLeagueUsers,
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

const removeUserFromLeague = async (newUserList: Array<LeagueUser>, leagueId: string): Promise<void> => {
  return update({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET userCount = :userCount,#users = :users',
    ExpressionAttributeNames: {
      '#users': 'users',
    },
    ExpressionAttributeValues: {
      ':users': newUserList,
      ':userCount': newUserList.length,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}
