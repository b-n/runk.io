jest.unmock('../../lib/middleware')
jest.unmock('../../lib/errors')
import { withMiddleware, Handler } from '../../lib/middleware'
import { NotFound, BadInput } from '../../lib/errors'

import config from '../../../config'

config.cors = {
  'Access-Control-Allow-Credentials': false,
  'Access-Control-Allow-Origin': '*',
}

describe('errors', () => {
  test('will handle NotFound', () => {
    const handler: Handler = async () => Promise.reject(new NotFound())

    return withMiddleware(handler)(null, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(JSON.parse(result.body)).toEqual({ message: 'Not Found' })
      })
  })

  test('will handle BadInput', () => {
    const handler: Handler = async () => Promise.reject(new BadInput('bad guy'))

    return withMiddleware(handler)(null, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(JSON.parse(result.body)).toEqual({ message: 'bad guy' })
      })
  })

  test('reformats uncaught exceptions to 500', () => {
    const handler: Handler = async () => Promise.reject(new Error('fail'))

    return withMiddleware(handler)(null, null)
      .then(result => {
        expect(result.statusCode).toEqual(500)
        expect(JSON.parse(result.body)).toEqual({ message: 'fail' })
      })
  })
})

test('stringify - because we like objects', () => {
  const handler: Handler = async () => ({ statusCode: 0, body: { hello: 'the cake is a lie' } })

  return withMiddleware(handler)(null, null)
    .then(result => {
      expect(result.statusCode).toEqual(0)
      expect(JSON.parse(result.body)).toEqual({ hello: 'the cake is a lie' })
    })
})

test('cors: will do cors for you', () => {
  const handler: Handler = async () => ({ statusCode: 0 })

  return withMiddleware(handler)(null, null)
    .then(result => {
      expect(result.statusCode).toEqual(0)
      expect(result.headers).toEqual(
        expect.objectContaining({
          ...config.cors,
        })
      )
    })
})
