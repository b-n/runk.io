import { handler } from '../../auth/auth'

import * as authorizer from '../../services/authorizer'

import customAuthorizerEvent from '../fixtures/customAuthorizerEvent.json'
import policyDocument from '../fixtures/policyDocument.json'

jest.mock('../../services/authorizer')

describe('auth', () => {
  afterEach(() => jest.clearAllMocks())

  const spies = {
    verify: jest.spyOn(authorizer, 'verify'),
    generatePolicy: jest.spyOn(authorizer, 'generatePolicy'),
  }

  test('ERROR: when no token', () => {
    const event = {
      ...customAuthorizerEvent,
    }

    return expect(handler(event))
      .rejects.toEqual(new Error('Unauthorized'))
  })

  test('ERROR: needs to be bearer', () => {
    const event = {
      ...customAuthorizerEvent,
      authorizationToken: 'NotABearer 123',
    }

    return expect(handler(event))
      .rejects.toEqual(new Error('Unauthorized'))
  })

  test('ERROR: needs to have a token too', () => {
    const event = {
      ...customAuthorizerEvent,
      authorizationToken: 'Bearer',
    }

    return expect(handler(event))
      .rejects.toEqual(new Error('Unauthorized'))
  })

  test('ERROR: should be a valid token', () => {
    spies.verify.mockImplementation(() => Promise.reject(new Error('fail')))

    const event = {
      ...customAuthorizerEvent,
      authorizationToken: 'Bearer 123',
    }

    return handler(event)
      .then(result => expect(result).toEqual(undefined))
      .catch(e => {
        expect(e).toEqual(new Error('Unauthorized'))
        expect(spies.verify).toHaveBeenCalledTimes(1)
      })
  })

  test('generates a valid policy', () => {
    spies.verify.mockImplementation(() => ({ userId: 'testing' }))
    spies.generatePolicy.mockImplementation(() => (policyDocument))

    const event = {
      ...customAuthorizerEvent,
      authorizationToken: 'Bearer 123',
    }

    return handler(event)
      .then(result => {
        expect(result).toEqual(policyDocument)
        expect(spies.verify).toHaveBeenCalledTimes(1)
        expect(spies.generatePolicy).toHaveBeenCalledTimes(1)
      })
  })
})
