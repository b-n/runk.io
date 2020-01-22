jest.unmock('../../match/post')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
jest.unmock('lodash/difference')
jest.unmock('lodash/uniqBy')
jest.unmock('lodash/round')
import { handler } from '../../match/post'

import eventHttp from '../fixtures/eventHttp.json'
import leagueMock from '../fixtures/league.json'
import leagueRoleMock from '../fixtures/leagueRole.json'
import matchMock from '../fixtures/match.json'

import * as validation from '../../lib/validation'
import * as elo from '../../lib/elo'
import * as match from '../../repositories/match'
import * as league from '../../repositories/league'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  getById: jest.spyOn(league, 'getById'),
  updateScores: jest.spyOn(league, 'updateScores'),
  create: jest.spyOn(match, 'create'),
  calculateNewRatings: jest.spyOn(elo, 'calculateNewRatings'),
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

  test('ERROR - need two users', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
      },
    }))

    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(0)
      })
  })

  test('ERROR: needs two teams', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
        bcd: {
          team: 1,
        },
      },
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(0)
      })
  })

  test('ERROR: no league with id', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
        bcd: {
          team: 2,
        },
      },
    }))
    spies.getById.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.create).toHaveBeenCalledTimes(0)
      })
  })

  test('ERROR: user is not part of league', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
        bcd: {
          team: 2,
        },
      },
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      ...leagueMock,
      users: {
        bcd: {
          ...leagueRoleMock,
          id: 'abc',
          role: LeagueRole.admin,
        },
        cde: {
          ...leagueRoleMock,
          id: 'bcd',
          role: LeagueRole.member,
        },
      },
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.create).toHaveBeenCalledTimes(0)
      })
  })

  test('ERROR: user does not exist on league', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
        cde: {
          team: 2,
        },
      },
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      ...leagueMock,
      users: {
        abc: {
          ...leagueRoleMock,
          id: 'abc',
          role: LeagueRole.admin,
        },
        bcd: {
          ...leagueRoleMock,
          id: 'bcd',
          role: LeagueRole.member,
        },
      },
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.create).toHaveBeenCalledTimes(0)
      })
  })

  test('success - creates a new match', () => {
    spies.validateRequest.mockImplementation(() => ({
      date: '2020-01-01T00:00:00Z',
      winner: 1,
      team: 'testing',
      users: {
        abc: {
          team: 1,
        },
        bcd: {
          team: 2,
        },
      },
    }))
    spies.getById.mockImplementation(() => Promise.resolve({
      ...leagueMock,
      users: {
        abc: {
          ...leagueRoleMock,
          id: 'abc',
          role: LeagueRole.admin,
        },
        bcd: {
          ...leagueRoleMock,
          id: 'bcd',
          role: LeagueRole.member,
        },
      },
    }))
    spies.calculateNewRatings.mockImplementation(() => ([1000, 1000]))
    spies.create.mockImplementation(() => Promise.resolve(matchMock))
    spies.updateScores.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      pathParameters: {
        leagueId: '123',
      },
      body: JSON.stringify({ displayName: 'testing' }),
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual(matchMock)
        expect(result.statusCode).toEqual(200)
        expect(spies.validateRequest).toHaveBeenCalledTimes(1)
        expect(spies.create).toHaveBeenCalledTimes(1)
        expect(spies.updateScores).toHaveBeenCalledTimes(1)
      })
  })
})
