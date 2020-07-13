import 'source-map-support/register'
import Joi from '@hapi/joi'
import difference from 'lodash/difference'

import { NotFound, BadInput } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, setUsers } from '../repositories/league'

const league: Handler = async (event) => {
  const { pathParameters, body } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  if (!body) {
    throw new BadInput('Request requires a body')
  }

  const usersToMutate: Array<LeagueUser> = validateRequest(
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
    {} as Record<string, LeagueUser>
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

  const missingUsers = difference(
    Object.keys(userMutateMap),
    Object.keys(league.users)
  )
  if (missingUsers.length > 0) {
    throw new BadInput(`User(s) with id(s): ${missingUsers.join(',')} do not exist in this league`)
  }

  const newUserData = await setUsers(league, userMutateMap)

  return {
    body: {
      ...league,
      users: newUserData,
    },
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
