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

  const leagueUsers = league.users.filter(user => user.id === userId)

  if (leagueUsers.length === 0 || leagueUsers[0].role !== LeagueRole.admin) {
    throw new BadInput('You need to be part of the league and an admin to change users')
  }

  const newUserState = league.users.map(user => ({
    ...user,
    ...userMutateMap[user.id],
  }))

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
