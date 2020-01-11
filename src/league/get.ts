import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { NotFound } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById } from '../repositories/league'

const league: Handler = async (event) => {
  // TODO: Need to handle getByIds
  const { pathParameters, requestContext } = event

  const { userId } = requestContext.authorizer

  const id = pathParameters && pathParameters.id

  console.log(id, userId)
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

  const leagues = await getById(id)
  return {
    body: leagues,
    statusCode: 200,
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(league)
