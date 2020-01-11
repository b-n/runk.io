jest.unmock('../../user/put')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../user/put'

import * as validation from '../../lib/validation'
import * as userRepo from '../../repositories/user'

import eventHttp from '../fixtures/eventHttp.json'

const spies = {
  update: jest.spyOn(userRepo, 'update'),
  validateRequest: jest.spyOn(validation, 'validateRequest'),
}

describe('PUT: user', () => {
  test('ERROR: requires body', () => {
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: '123' },
      },
      body: '',
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
      })
  })

  test('update the current user details', () => {
    spies.validateRequest.mockImplementation(() => ({
      email: 'test@example.com',
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: '123' },
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(204)
        expect(spies.update).toHaveBeenCalledTimes(1)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
      })
  })
})
