import { APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { withMiddleware } from './services/middleware'

const user = async (event, _context) => {
  return {
    statusCode: 200,
    body: {
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    },
  }
}

export const handler: APIGatewayProxyHandler = withMiddleware(user)
