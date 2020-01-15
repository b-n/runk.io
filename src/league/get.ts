import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById } from '../repositories/league'

const league: Handler = async (event) => {
  const { pathParameters } = event

  const id = pathParameters && pathParameters.id

  if (!id) {
    throw new BadInput('Need to supply ids parameter')
  }

  const league = await getById(id)

  if (!league) {
    throw new NotFound()
  }

  return {
    body: league,
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
