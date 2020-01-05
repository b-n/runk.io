import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { withMiddleware } from './lib/middleware'

const user = async (event, _context) => {
  return {
    statusCode: 200,
    body: {
      input: event,
      context: _context,
    },
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(user)
