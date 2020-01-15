jest.unmock('../../league/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../league/get'

import * as league from '../../repositories/league'

import eventHttp from '../fixtures/eventHttp.json'
import leagueMock from '../fixtures/league.json'

const spies = {
  getById: jest.spyOn(league, 'getById'),
}

describe('GET: league/{id}', () => {
  test('ERROR: id param needs a value', () => {
    const event = {
      ...eventHttp,
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
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
      })
  })

  test('success - can find league', () => {
    spies.getById.mockImplementation(() => Promise.resolve(leagueMock))
    const event = {
      ...eventHttp,
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual(leagueMock)
        expect(result.statusCode).toEqual(200)
      })
  })
})
