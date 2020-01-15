import 'source-map-support/register'
import Joi from '@hapi/joi'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, addUser } from '../repositories/league'
import { addLeague } from '../repositories/user'

const league: Handler = async (event) => {
  const { pathParameters, body } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  if (!body) {
    throw new BadInput('Request requires a body')
  }

  const suppliedInviteCode = validateRequest(
    JSON.parse(body),
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

  if (league.users[userId]) {
    throw new BadInput('Already joined the league')
  }

  await addUser(id, userId)
    .then(() => addLeague(userId, league))

  return {
    statusCode: 204,
  }
}

export const handler = withMiddleware(league)
