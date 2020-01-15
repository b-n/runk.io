jest.unmock('../../league/join')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../league/join'

import * as validation from '../../lib/validation'
import * as league from '../../repositories/league'

import eventHttp from '../fixtures/eventHttp.json'
import leagueMock from '../fixtures/league.json'
import leagueRoleMock from '../fixtures/leagueRole.json'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  getById: jest.spyOn(league, 'getById'),
  addUser: jest.spyOn(league, 'addUser'),
}

test('ERROR: not found', () => {
  spies.validateRequest.mockImplementation(() => ({ inviteCode: null }))
  spies.getById.mockImplementation(() => null)
  const event = {
    ...eventHttp,
    body: JSON.stringify({ inviteCode: 123 }),
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(404)
      expect(spies.validateRequest).toHaveBeenCalledTimes(1)
    })
})

test('ERROR: inviteCode required', () => {
  spies.validateRequest.mockImplementation(() => ({ inviteCode: null }))
  spies.getById.mockImplementation(() => Promise.resolve({
    ...leagueMock,
    inviteCode: '123',
  }))
  const event = {
    ...eventHttp,
    body: JSON.stringify({ inviteCode: null }),
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(400)
      expect(spies.validateRequest).toHaveBeenCalledTimes(1)
    })
})

test('ERROR: already joined', () => {
  spies.validateRequest.mockImplementation(() => ({ inviteCode: null }))
  spies.getById.mockImplementation(() => Promise.resolve({
    ...leagueMock,
    inviteCode: null,
    users: [{
      ...leagueRoleMock,
      id: 'abc',
      role: LeagueRole.admin,
    }],
  }))
  const event = {
    ...eventHttp,
    body: JSON.stringify({ inviteCode: null }),
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(400)
      expect(spies.validateRequest).toHaveBeenCalledTimes(1)
    })
})

test('success - added to the league - inviteCode null', () => {
  spies.validateRequest.mockImplementation(() => ({ inviteCode: null }))
  spies.getById.mockImplementation(() => Promise.resolve({
    ...leagueMock,
    inviteCode: null,
    users: [{
      ...leagueRoleMock,
      id: 'zzz',
      role: LeagueRole.admin,
    }],
  }))
  spies.addUser.mockImplementation(() => Promise.resolve(null))
  const event = {
    ...eventHttp,
    body: JSON.stringify({ inviteCode: null }),
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(204)
      expect(spies.validateRequest).toHaveBeenCalledTimes(1)
      expect(spies.addUser).toHaveBeenCalledWith('123', 'abc')
    })
})

test('success - added to the league - inviteCode matches', () => {
  spies.validateRequest.mockImplementation(() => ({ inviteCode: 'meow' }))
  spies.getById.mockImplementation(() => Promise.resolve({
    ...leagueMock,
    inviteCode: 'meow',
    users: [{
      ...leagueRoleMock,
      id: 'zzz',
      role: LeagueRole.admin,
    }],
  }))
  spies.addUser.mockImplementation(() => Promise.resolve(null))
  const event = {
    ...eventHttp,
    body: JSON.stringify({ inviteCode: null }),
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(204)
      expect(spies.validateRequest).toHaveBeenCalledTimes(1)
      expect(spies.addUser).toHaveBeenCalledWith('123', 'abc')
    })
})
