import 'source-map-support/register'

import { withMiddleware, Handler } from '../lib/middleware'

import { getAll } from '../repositories/league'

const league: Handler = async () => {
  const leagues = await getAll()

  return {
    body: leagues,
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
