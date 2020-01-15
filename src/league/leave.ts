import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, removeUser } from '../repositories/league'
import { removeLeague } from '../repositories/user'

const league: Handler = async (event) => {
  const { pathParameters } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  if (!league.users[userId]) {
    throw new BadInput('You cannot leave a league you were not part of')
  }

  const leagueAdmins = Object.values(league.users).filter(user => user.role === LeagueRole.admin)

  if (leagueAdmins.length === 1 && leagueAdmins[0].id === userId) {
    throw new BadInput('The last admin cannot abandon a league. Delete it instead')
  }

  await removeUser(
    id,
    userId
  )
    .then(() => removeLeague(userId, id))

  return {
    statusCode: 204,
  }
}

export const handler = withMiddleware(league)
