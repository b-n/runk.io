import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'
import Joi from '@hapi/joi'
import uuidv4 from 'uuid/v4'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, create, update } from '../repositories/league'

const league: Handler = async (event) => {
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

    await update(id, newLeague)

    return {
      statusCode: 204,
    }
  }

  const leagues = await create({
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
