jest.unmock('../../auth/token')
jest.unmock('../../lib/middleware')
jest.unmock('../../lib/errors')
import { handler } from '../../auth/token'

import { AuthorizerError } from '../../lib/errors'

import * as google from '../../lib/google'
import * as authLib from '../../lib/auth'
import * as userRepo from '../../repositories/user'
import * as authorizerRepo from '../../repositories/authorizer'

import eventHttp from '../fixtures/eventHttp.json'
import authResult from '../fixtures/authResult.json'
import userMock from '../fixtures/user.json'

describe('GET: token', () => {
  const spies = {
    checkAuthCode: jest.spyOn(google, 'checkAuthCode'),
    update: jest.spyOn(userRepo, 'update'),
    createFromAuthResult: jest.spyOn(userRepo, 'createFromAuthResult'),
    getUserIdByAuthId: jest.spyOn(authorizerRepo, 'getUserIdByAuthId'),
    verify: jest.spyOn(authLib, 'verify'),
    sign: jest.spyOn(authLib, 'sign'),
    getById: jest.spyOn(userRepo, 'getById'),
  }

  test('provides a list of login URLs', () => {
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: '',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(200)
        expect(JSON.parse(result.body)).toEqual(
          expect.objectContaining({
            loginUrls: {},
          })
        )
      })
  })

  describe('grant_type: authorization_code', () => {
    test('ERROR: requires code query param', () => {
      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          state: 'testing',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Requires both code and state')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: requires state query param', () => {
      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          code: 'testing',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Requires both code and state')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: requires valid authorizer type', () => {
      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          code: 'testing',
          state: 'testing',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Invalid authorizer: testing')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: requires a valid auth response', () => {
      spies.checkAuthCode.mockImplementation(() => { throw new AuthorizerError('fail') })

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          code: 'testing',
          state: 'GoOgLe',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('fail')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('success - existing user', () => {
      spies.checkAuthCode.mockImplementation(() => Promise.resolve(authResult))
      spies.getUserIdByAuthId.mockImplementation(() => Promise.resolve('123'))
      spies.update.mockImplementation(() => Promise.resolve(null))
      spies.sign.mockImplementation(() => '123')

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          code: 'testing',
          state: 'GoOgLe',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
            access_token: expect.any(String),
            token_type: 'Bearer',
            expires_in: expect.any(Number),
            refresh_token: expect.any(String),
          }))
          expect(result.statusCode).toEqual(200)
        })
    })

    test('success - new user', () => {
      spies.checkAuthCode.mockImplementation(() => Promise.resolve(authResult))
      spies.getUserIdByAuthId.mockImplementation(() => Promise.resolve(null))
      spies.update.mockImplementation(() => Promise.resolve(null))
      spies.sign.mockImplementation(() => '123')
      spies.createFromAuthResult.mockImplementation(() => Promise.resolve(userMock))

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'authorization_code',
          code: 'testing',
          state: 'GoOgLe',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
            access_token: expect.any(String),
            token_type: 'Bearer',
            expires_in: expect.any(Number),
            refresh_token: expect.any(String),
          }))
          expect(result.statusCode).toEqual(200)
        })
    })
  })

  describe('grant_type: refresh_token', () => {
    test('ERROR: needs a token', () => {
      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Requires a refresh token')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: not a jwt token', () => {
      spies.verify.mockImplementation(() => { throw new AuthorizerError('bad token') })

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
          refresh_token: '123',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('bad token')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: no user', () => {
      spies.verify.mockImplementation(() => ({ userId: '123' }))
      spies.getById.mockImplementation(() => Promise.resolve(null))

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
          refresh_token: '123',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Invalid refresh token')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: not a matching token', () => {
      spies.verify.mockImplementation(() => ({ userId: '123' }))
      spies.getById.mockImplementation(() => Promise.resolve({
        ...userMock,
        refreshToken: '234',
      }))

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
          refresh_token: '123',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Invalid refresh token')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('ERROR: inactive user', () => {
      spies.verify.mockImplementation(() => ({ userId: '123' }))
      spies.getById.mockImplementation(() => Promise.resolve({
        ...userMock,
        refreshToken: '123',
        isActive: false,
      }))

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
          refresh_token: '123',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body).message).toEqual('Unauthorized')
          expect(result.statusCode).toEqual(400)
        })
    })

    test('success - new tokens', () => {
      spies.verify.mockImplementation(() => ({ userId: '123' }))
      spies.getById.mockImplementation(() => Promise.resolve({
        ...userMock,
        refreshToken: '123',
      }))
      spies.update.mockImplementation(() => Promise.resolve(null))
      spies.sign.mockImplementation(() => '123')

      const event = {
        ...eventHttp,
        queryStringParameters: {
          grant_type: 'refresh_token',
          refresh_token: '123',
        },
      }

      return handler(event, null)
        .then((result) => {
          expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
            access_token: expect.any(String),
            token_type: 'Bearer',
            expires_in: expect.any(Number),
            refresh_token: expect.any(String),
          }))
          expect(result.statusCode).toEqual(200)
        })
    })
  })

  test('grant_type: invalid', () => {
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'invalid_grant',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(400)
        expect(JSON.parse(result.body)).toEqual({ message: 'invalid grant_type' })
      })
  })

  test('Error: unexpected error = Server', () => {
    spies.verify.mockImplementation(() => { throw new Error('fail') })
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'refresh_token',
        refresh_token: '123',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(500)
        expect(JSON.parse(result.body)).toEqual({ message: 'fail' })
      })
  })
})
