import 'source-map-support/register'
import Joi from '@hapi/joi'

import { BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById as getUserById, addLeague } from '../repositories/user'
import { create } from '../repositories/league'

const league: Handler = async (event) => {
  const { body } = event

  if (!body) {
    throw new BadInput('Requires a body')
  }

  const newLeague: League = validateRequest(
    JSON.parse(body),
    Joi.object({
      id: Joi.string().disallow(),
      displayName: Joi.string().min(1).required(),
      description: Joi.string().min(1).required(),
      pictureURL: Joi.string().min(1).required(),
      inviteCode: Joi.string().allow(null).default(null),
    }),
    { ErrorClass: BadInput }
  )

  const { userId } = event.requestContext.authorizer

  const user = await getUserById(userId, {})

  const league = await create(newLeague, user)
    .then(league =>
      addLeague(userId, league)
        .then(() => league)
    )

  return {
    body: league,
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
