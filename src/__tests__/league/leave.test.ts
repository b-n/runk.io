jest.unmock('../../league/leave')
jest.unmock('../../lib/middleware')
import { handler } from '../../league/leave'

import * as league from '../../repositories/league'
import * as user from '../../repositories/user'

import eventHttp from '../fixtures/eventHttp.json'

const spies = {
  getById: jest.spyOn(league, 'getById'),
  setUsers: jest.spyOn(league, 'setUsers'),
  removeLeague: jest.spyOn(user, 'removeLeague'),
}

test('ERROR: not found', () => {
  spies.getById.mockImplementation(() => null)
  const event = {
    ...eventHttp,
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(404)
      expect(spies.getById).toHaveBeenCalledWith('123')
    })
})

test('ERROR: need to be part of the league', () => {
  spies.getById.mockImplementation(() => Promise.resolve({
    displayName: 'testing',
    inviteCode: '123',
    users: [{
      id: 'zzz',
      isActive: true,
      role: LeagueRole.admin,
      score: 1000,
    }],
  }))
  const event = {
    ...eventHttp,
    requestContext: {
      ...eventHttp.requestContext,
      authorizer: { userId: 'abc' },
    },
    pathParameters: { id: '123' },
  }

  return handler(event, null)
    .then(result => {
      expect(result.statusCode).toEqual(400)
      expect(spies.getById).toHaveBeenCalledWith('123')
    })
})

test('ERROR: last admin cannot leave', () => {
  spies.getById.mockImplementation(() => Promise.resolve({
    displayName: 'testing',
    inviteCode: null,
    users: [{
      id: 'abc',
      role: LeagueRole.admin,
      score: 1000,
      isActive: true,
    }, {
      id: 'bcd',
      role: LeagueRole.member,
      score: 1000,
      isActive: true,
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
      expect(spies.getById).toHaveBeenCalledWith('123')
    })
})

test('success - added to the league', () => {
  spies.getById.mockImplementation(() => Promise.resolve({
    displayName: 'testing',
    inviteCode: null,
    users: [{
      id: 'abc',
      role: LeagueRole.admin,
      score: 1000,
      isActive: true,
    }, {
      id: 'bcd',
      role: LeagueRole.admin,
      score: 1000,
      isActive: true,
    }],
  }))
  spies.setUsers.mockImplementation(() => Promise.resolve(null))
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
      expect(spies.getById).toHaveBeenCalledWith('123')
      expect(spies.removeLeague).toHaveBeenCalledWith('abc', '123')
    })
})
