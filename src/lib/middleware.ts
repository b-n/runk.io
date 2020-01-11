import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { NotFound, BadInput } from './errors'
import config from '../../config'

const errors = (error: any) => {
  if (error instanceof NotFound) {
    return {
      body: { message: 'Not Found' },
      statusCode: 404,
    }
  }

  if (error instanceof BadInput) {
    return {
      body: { message: error.message },
      statusCode: 400,
    }
  }

  return {
    body: { message: error.message },
    statusCode: 500,
  }
}

const cors = (result: any) => ({
  ...result,
  headers: {
    ...result.headers,
    ...config.cors,
  },
})

const stringify = (result: any) => ({
  ...result,
  body: JSON.stringify(result.body),
})

interface HandlerResult {
  body?: {
    [name: string]: any
  }
  headers?: {
    [name: string]: any
  }
  statusCode: number
}

export type Handler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<HandlerResult>

export const withMiddleware = (handler: Handler) =>
  (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> =>
    Promise.resolve(handler(event, context))
      .catch(error => errors(error))
      .then(result => stringify(result))
      .then(result => cors(result))
