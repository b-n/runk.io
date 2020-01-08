import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { NotFound, BadInput } from './errors'
import config from '../../config'

const errors = (error) => {
  const message = error instanceof NotFound
    ? 'Not Found'
    : error.message

  const statusCode = error instanceof NotFound
    ? 404
    : error instanceof BadInput
      ? 400
      : 500

  return {
    body: { message },
    statusCode,
  }
}

const cors = (result) => ({
  ...result,
  headers: {
    ...result.headers,
    ...config.cors,
  },
})

const stringify = (result) => ({
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
