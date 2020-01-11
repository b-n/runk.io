import 'source-map-support/register'

import { NotFound } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById } from '../repositories/user'

const user: Handler = async (event, _context) => {
  const { pathParameters, requestContext } = event
  const { userId } = requestContext.authorizer

  const id = (pathParameters && pathParameters.id) || userId

  const user = await getById(id, { sameUser: id === userId })
  if (!user) {
    throw new NotFound()
  }

  return {
    statusCode: 200,
    body: {
      ...user,
    },
  }
}

export const handler = withMiddleware(user)
