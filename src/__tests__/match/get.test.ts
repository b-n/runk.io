jest.unmock('../../match/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../match/get'

import * as match from '../../repositories/match'

import eventHttp from '../fixtures/eventHttp.json'
import matchMock from '../fixtures/match.json'

const spies = {
  getById: jest.spyOn(match, 'getById'),
  getByLeagueId: jest.spyOn(match, 'getByLeagueId'),
}

describe('GET: match/{id}', () => {
  test('ERROR: id param needs a value', () => {
    const event = {
      ...eventHttp,
      path: 'match/',
      pathParameters: {
        id: '',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
      })
  })

  test('ERROR: no such id', () => {
    spies.getById.mockImplementation(() => Promise.resolve(null))
    const event = {
      ...eventHttp,
      path: 'match/123',
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
      })
  })

  test('success - can find the match', () => {
    spies.getById.mockImplementation(() => Promise.resolve(matchMock))
    const event = {
      ...eventHttp,
      path: 'match/123',
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual(matchMock)
        expect(spies.getById).toHaveBeenCalledWith('123')
        expect(result.statusCode).toEqual(200)
      })
  })
})

describe('GET: league/{id}/match', () => {
  test('ERROR: leagueId needs a value', () => {
    const event = {
      ...eventHttp,
      path: 'league//match',
      pathParameters: {
        id: '',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(400)
      })
  })

  test('success - gets some matches', () => {
    spies.getByLeagueId.mockImplementation(() => Promise.resolve([matchMock]))
    const event = {
      ...eventHttp,
      path: 'league/123/match',
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual([matchMock])
        expect(spies.getByLeagueId).toHaveBeenCalledWith('123')
        expect(result.statusCode).toEqual(200)
      })
  })
})
