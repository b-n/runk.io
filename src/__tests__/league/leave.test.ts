jest.unmock('../../league/leave')
jest.unmock('../../lib/middleware')
import { handler } from '../../league/leave'

import * as league from '../../repositories/league'
import * as user from '../../repositories/user'

import eventHttp from '../fixtures/eventHttp.json'
import leagueMock from '../fixtures/league.json'
import leagueRoleMock from '../fixtures/leagueRole.json'

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
    ...leagueMock,
    users: [{
      ...leagueRoleMock,
      id: 'zzz',
      role: LeagueRole.admin,
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
    ...leagueMock,
    users: [{
      ...leagueRoleMock,
      id: 'abc',
      role: LeagueRole.admin,
    }, {
      ...leagueRoleMock,
      id: 'bcd',
      role: LeagueRole.member,
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
    ...leagueMock,
    users: [{
      ...leagueRoleMock,
      id: 'abc',
      role: LeagueRole.admin,
    }, {
      ...leagueRoleMock,
      id: 'bcd',
      role: LeagueRole.admin,
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
