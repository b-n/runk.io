import { handler } from '../../auth/token'

import { AuthorizerError } from '../../services/errors'

import * as authorizer from '../../services/authorizer'

import eventHttp from '../fixtures/eventHttp.json'

jest.mock('../../services/authorizer')

describe('GET: token', () => {
  const spies = {
    generateLoginUrls: jest.spyOn(authorizer, 'generateLoginUrls'),
    getTokenFromAuthCode: jest.spyOn(authorizer, 'getTokenFromAuthCode'),
    getTokenFromRefreshToken: jest.spyOn(authorizer, 'getTokenFromRefreshToken'),
  }

  test('provides a list of login URLs', () => {
    const loginUrls = {
      runk: 'https://runk.nl/ruuuuuuunk',
    }
    spies.generateLoginUrls.mockImplementation(() => loginUrls)
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: undefined,
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(200)
        expect(JSON.parse(result.body)).toEqual(
          expect.objectContaining({
            loginUrls: loginUrls,
          })
        )
        spies.generateLoginUrls.mockClear()
      })
  })

  test('grant_type: authorization_code', () => {
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'authorization_code',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(200)
        expect(spies.getTokenFromAuthCode).toHaveBeenCalledTimes(1)
        spies.getTokenFromAuthCode.mockClear()
      })
  })

  test('grant_type: refresh_token', () => {
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'refresh_token',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(200)
        expect(spies.getTokenFromRefreshToken).toHaveBeenCalledTimes(1)
        spies.getTokenFromRefreshToken.mockClear()
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

  test('Error: AuthorizerError = BadInput', () => {
    spies.getTokenFromAuthCode.mockImplementation(() => {
      return Promise.reject(new AuthorizerError('fail'))
    })
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'authorization_code',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(400)
        expect(spies.getTokenFromAuthCode).toHaveBeenCalledTimes(1)
        expect(JSON.parse(result.body)).toEqual({ message: 'fail' })
        spies.getTokenFromAuthCode.mockClear()
      })
  })

  test('Error: unexpected error = Server', () => {
    spies.getTokenFromAuthCode.mockImplementation(() => {
      return Promise.reject(new Error('fail'))
    })
    const event = {
      ...eventHttp,
      queryStringParameters: {
        grant_type: 'authorization_code',
      },
    }

    return handler(event, null)
      .then((result) => {
        expect(result.statusCode).toEqual(500)
        expect(spies.getTokenFromAuthCode).toHaveBeenCalledTimes(1)
        expect(JSON.parse(result.body)).toEqual({ message: 'fail' })
        spies.getTokenFromAuthCode.mockClear()
      })
  })
})
