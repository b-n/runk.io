jest.unmock('../../league/put')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../league/put'

import eventHttp from '../fixtures/eventHttp.json'
import leagueMock from '../fixtures/league.json'

import * as validation from '../../lib/validation'
import * as league from '../../repositories/league'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  getById: jest.spyOn(league, 'getById'),
  update: jest.spyOn(league, 'update'),
}

describe('POST: league/{id}', () => {
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

  test('ERROR: doesn\'t exist', () => {
    spies.validateRequest.mockImplementation(() => (leagueMock))
    spies.getById.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: { id: '123' },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
      })
  })

  test('ERROR: can\'t find user', () => {
    spies.validateRequest.mockImplementation(() => (leagueMock))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      inviteCode: null,
      pictureURL: '',
      users: [{
        id: 'zzz',
        pictureURL: '',
        displayName: '',
        role: LeagueRole.member,
        score: 1000,
        isActive: true,
      }],
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: { id: '123' },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
      })
  })

  test('ERROR: user is not admin', () => {
    spies.validateRequest.mockImplementation(() => (leagueMock))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      pictureURL: '',
      inviteCode: null,
      users: [{
        id: 'abc',
        pictureURL: '',
        displayName: '',
        role: LeagueRole.member,
        score: 1000,
        isActive: true,
      }],
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: { id: '123' },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
      })
  })

  test('success - updates the league', () => {
    spies.validateRequest.mockImplementation(() => (leagueMock))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      pictureURL: '',
      inviteCode: null,
      users: [{
        id: 'abc',
        displayName: '',
        pictureURL: '',
        role: LeagueRole.admin,
        score: 1000,
        isActive: true,
      }],
    }))
    spies.update.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: { id: '123' },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(204)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.update).toHaveBeenCalledTimes(1)
      })
  })
})
