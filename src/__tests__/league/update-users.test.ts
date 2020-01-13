jest.unmock('../../league/update-users')
jest.unmock('../../lib/middleware')
jest.unmock('@hapi/joi')
import { handler } from '../../league/update-users'

import eventHttp from '../fixtures/eventHttp.json'

import * as validation from '../../lib/validation'
import * as league from '../../repositories/league'

const spies = {
  validateRequest: jest.spyOn(validation, 'validateRequest'),
  getById: jest.spyOn(league, 'getById'),
  setUsers: jest.spyOn(league, 'setUsers'),
}

describe('POST: /league/{id}/update-users', () => {
  test('ERROR: requires body', () => {
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
      })
  })

  test('ERROR: cannot mutate yourself', () => {
    spies.validateRequest.mockImplementation(() => [
      {
        id: 'abc',
        role: LeagueRole.admin,
        isActive: true,
      },
    ])

    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: 'null',
      pathParameters: { id: '123' },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
      })
  })

  test('ERROR: no such league', () => {
    spies.validateRequest.mockImplementation(() => [
      {
        id: 'bcd',
        role: LeagueRole.admin,
        isActive: true,
      },
    ])
    spies.getById.mockImplementation(() => Promise.resolve(null))

    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: 'null',
      pathParameters: { id: '123' },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
        expect(spies.getById).toHaveBeenCalledWith('123')
      })
  })

  test('ERROR: need to be admin', () => {
    const existingLeague = {
      id: '123',
      displayName: 'testing',
      inviteCode: 'test',
      users: [{
        id: 'abc',
        isActive: true,
        role: LeagueRole.member,
        score: 1000,
      }],
    }
    spies.validateRequest.mockImplementation(() => [
      {
        id: 'bcd',
        role: LeagueRole.admin,
        isActive: true,
      },
    ])
    spies.getById.mockImplementation(() => Promise.resolve(existingLeague))
    spies.setUsers.mockImplementation(() => Promise.resolve(null))

    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: 'null',
      pathParameters: { id: '123' },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
        expect(spies.getById).toHaveBeenCalledWith('123')
      })
  })

  test('success - updates the users', () => {
    const existingLeague = {
      id: '123',
      displayName: 'testing',
      inviteCode: 'test',
      users: [{
        id: 'abc',
        isActive: true,
        role: LeagueRole.admin,
        score: 1000,
      },
      {
        id: 'bcd',
        isActive: false,
        role: LeagueRole.member,
        score: 1000,
      }],
    }
    spies.validateRequest.mockImplementation(() => [
      {
        id: 'bcd',
        role: LeagueRole.admin,
        isActive: true,
      },
      {
        id: 'cde',
        isActive: false,
      },
    ])
    spies.getById.mockImplementation(() => Promise.resolve(existingLeague))
    spies.setUsers.mockImplementation(() => Promise.resolve(null))

    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: { userId: 'abc' },
      },
      body: 'null',
      pathParameters: { id: '123' },
    }

    return handler(event, null)
      .then(result => {
        const expectedNewUsers = [{
          id: 'abc',
          isActive: true,
          role: LeagueRole.admin,
          score: 1000,
        }, {
          id: 'bcd',
          isActive: true,
          role: LeagueRole.admin,
          score: 1000,
        }]

        expect(JSON.parse(result.body)).toEqual({
          ...existingLeague,
          users: expectedNewUsers,
        })
        expect(result.statusCode).toEqual(200)
        expect(spies.getById).toHaveBeenCalledWith('123')
        expect(spies.setUsers).toHaveBeenCalledWith(
          '123',
          expectedNewUsers
        )
      })
  })
})
