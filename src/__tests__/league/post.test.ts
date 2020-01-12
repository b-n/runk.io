jest.unmock('../../league/post')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../league/post'

import eventHttp from '../fixtures/eventHttp.json'

import * as validation from '../../lib/validation'
import * as league from '../../repositories/league'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  create: jest.spyOn(league, 'create'),
  getById: jest.spyOn(league, 'getById'),
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
    spies.validateRequest.mockImplementation(() => ({
      displayName: 'testing',
      inviteCode: null,
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

describe('POST: league/{id}', () => {
  test('ERROR: doesn\'t exist', () => {
    spies.validateRequest.mockImplementation(() => ({
      displayName: 'testing',
      inviteCode: null,
    }))
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
    spies.validateRequest.mockImplementation(() => ({
      displayName: 'testing',
      inviteCode: null,
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      inviteCode: null,
      users: [{
        id: 'zzz',
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
    spies.validateRequest.mockImplementation(() => ({
      displayName: 'testing',
      inviteCode: null,
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      inviteCode: null,
      users: [{
        id: 'abc',
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
    spies.validateRequest.mockImplementation(() => ({
      displayName: 'testing',
      inviteCode: null,
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      id: '123',
      displayName: 'testing',
      inviteCode: null,
      users: [{
        id: 'abc',
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
