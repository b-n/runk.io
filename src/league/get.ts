import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById } from '../repositories/league'

const league: Handler = async (event) => {
  const { pathParameters } = event

  const id = pathParameters && pathParameters.id

  if (id) {
    const league = await getById(id)

    if (!league) {
      throw new NotFound()
    }

    return {
      body: league,
      statusCode: 200,
    }
  }

  const ids = pathParameters && pathParameters.ids

  if (ids) {
    // TODO: bulk
    const recordIds = ids.split(',')
    const leagues = [await getById(recordIds[0])]

    if (leagues.length === 404) {
      throw new NotFound()
    }

    return {
      body: leagues,
      statusCode: 200,
    }
  }

  throw new BadInput('Need to supply ids parameter')
}

export const handler = withMiddleware(league)
