jest.unmock('../../league/post')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../league/post'

import eventHttp from '../fixtures/eventHttp.json'
import userMock from '../fixtures/user.json'
import leagueMock from '../fixtures/league.json'

import * as validation from '../../lib/validation'
import * as user from '../../repositories/user'
import * as league from '../../repositories/league'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  create: jest.spyOn(league, 'create'),
  getById: jest.spyOn(user, 'getById'),
  update: jest.spyOn(league, 'update'),
}

describe('POST: league', () => {
  test('requires body', () => {
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: '',
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
      })
  })

  test('success - creates new league', () => {
    spies.validateRequest.mockImplementation(() => (leagueMock))
    spies.getById.mockImplementation(() => Promise.resolve({
      ...userMock,
    }))
    spies.create.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(200)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.create).toHaveBeenCalledTimes(1)
      })
  })
})
