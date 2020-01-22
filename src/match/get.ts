import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, getByLeagueId } from '../repositories/match'

const match: Handler = async (event) => {
  const { pathParameters } = event

  if (pathParameters.leagueId !== undefined) {
    const leagueId = pathParameters && pathParameters.leagueId

    if (!leagueId) {
      throw new BadInput('Need to supply a leagueId')
    }

    const matches = await getByLeagueId(leagueId)

    return {
      body: matches,
      statusCode: 200,
    }
  }

  const id = pathParameters && pathParameters.id

  if (!id) {
    throw new BadInput('Need to supply an id')
  }

  const match = await getById(id)

  if (!match) {
    throw new NotFound()
  }

  return {
    body: match,
    statusCode: 200,
  }
}

export const handler = withMiddleware(match)
