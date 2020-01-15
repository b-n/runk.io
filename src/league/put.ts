import 'source-map-support/register'
import Joi from '@hapi/joi'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, update } from '../repositories/league'

const league: Handler = async (event) => {
  const { pathParameters, body } = event

  if (!body) {
    throw new BadInput('Requires a body')
  }

  const newLeague: League = validateRequest(
    JSON.parse(body),
    Joi.object({
      displayName: Joi.string().min(1).required(),
      inviteCode: Joi.string().allow(null).default(null),
    }),
    { ErrorClass: BadInput }
  )

  const { userId } = event.requestContext.authorizer

  const id = pathParameters && pathParameters.id

  const existingLeague = await getById(id)

  if (!existingLeague) {
    throw new NotFound()
  }

  const leagueUser = existingLeague.users[userId]

  if (!leagueUser) {
    throw new NotFound()
  }

  if (leagueUser.role !== LeagueRole.admin) {
    throw new BadInput('User is not an admin of league')
  }

  await update(id, newLeague)

  return {
    statusCode: 204,
  }
}

export const handler = withMiddleware(league)
