jest.unmock('../../league/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../league/get'

import * as league from '../../repositories/league'

import eventHttp from '../fixtures/eventHttp.json'

const spies = {
  getById: jest.spyOn(league, 'getById'),
}

describe('GET: league', () => {
  // TODO: this
})

describe('GET: league/{id}', () => {
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
    spies.getById.mockImplementation(() => Promise.resolve({
      displayName: 'testing League',
      inviteCode: '123',
    }))
    const event = {
      ...eventHttp,
      pathParameters: {
        id: '123',
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(200)
      })
  })
})
