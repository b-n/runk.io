import config from '../../config'

const errors = (error) => ({
  body: {
    message: error.message,
  },
  statusCode: 500,
})

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

export const withMiddleware = (handler) => (event, context) =>
  handler(event, context)
    .catch(error => errors(error))
    .then(result => stringify(result))
    .then(result => cors(result))
