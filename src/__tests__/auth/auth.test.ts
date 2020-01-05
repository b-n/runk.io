jest.unmock('../../auth/auth')
import { handler } from '../../auth/auth'

import * as auth from '../../lib/auth'

import customAuthorizerEvent from '../fixtures/customAuthorizerEvent.json'

describe('auth', () => {
  const spies = {
    verify: jest.spyOn(auth, 'verify'),
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
    spies.verify.mockImplementation(() => {
      throw new Error('fail')
    })

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

    const event = {
      ...customAuthorizerEvent,
      authorizationToken: 'Bearer 123',
    }

    const expectedDocument = {
      principalId: 'testing',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
      context: { userId: 'testing' },
    }

    return handler(event)
      .then(result => {
        expect(result).toEqual(expectedDocument)
        expect(spies.verify).toHaveBeenCalledTimes(1)
      })
  })
})
