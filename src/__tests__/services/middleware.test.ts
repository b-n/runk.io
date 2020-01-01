import { withMiddleware, Handler } from '../../services/middleware'

import config from '../../../config'

config.cors = {
  'Access-Control-Allow-Credentials': false,
  'Access-Control-Allow-Origin': '*',
}

describe('GET: token', () => {
  test('reformats uncaught exceptions to 500', () => {
    const handler: Handler = async () => Promise.reject(new Error('fail'))

    return withMiddleware(handler)(null, null)
      .then(result => {
        expect(result.statusCode).toEqual(500)
        expect(JSON.parse(result.body)).toEqual({ message: 'fail' })
      })
  })

  test('stringifies so you don\'t have to™', () => {
    const handler: Handler = async () => ({ statusCode: 0, body: { hello: 'the cake is a lie' } })

    return withMiddleware(handler)(null, null)
      .then(result => {
        expect(result.statusCode).toEqual(0)
        expect(JSON.parse(result.body)).toEqual({ hello: 'the cake is a lie' })
      })
  })

  test('cors all the things', () => {
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
})
