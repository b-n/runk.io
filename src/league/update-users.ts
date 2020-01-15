import 'source-map-support/register'
import Joi from '@hapi/joi'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, setUsers } from '../repositories/league'

interface LeagueUserUpdate {
  id: string
  isActive: boolean
  role: LeagueRole
}

const league: Handler = async (event) => {
  const { pathParameters, body } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  if (!body) {
    throw new BadInput('Request requires a body')
  }

  const usersToMutate: Array<LeagueUserUpdate> = validateRequest(
    JSON.parse(body),
    Joi.array().items(Joi.object({
      id: Joi.string().uuid().required(),
      isActive: Joi.boolean().required(),
      role: Joi.string().valid('admin', 'user'),
    })),
    { ErrorClass: BadInput }
  )

  const userMutateMap = usersToMutate.reduce(
    (a, c) => { a[c.id] = c; return a },
    {} as Record<string, LeagueUserUpdate>
  )

  if (userMutateMap[userId]) {
    throw new BadInput('Cannot update yourself with this command')
  }

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  const leagueUser = league.users[userId]

  if (!leagueUser || leagueUser.role !== LeagueRole.admin) {
    throw new BadInput('You need to be part of the league and an admin to change users')
  }

  const newUserState = usersToMutate.reduce((a, c) => {
    const { id, isActive, role } = c
    if (!a[id]) {
      throw new BadInput(`User ${id} does not exist in this league`)
    }
    a[id] = {
      ...a[id],
      isActive,
      role,
    }
    return a
  }, league.users)

  await setUsers(id, newUserState)

  return {
    body: {
      ...league,
      users: newUserState,
    },
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
