jest.unmock('../../discover/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../discover/get'

import * as league from '../../repositories/league'

import leagueMock from '../fixtures/league.json'

const spies = {
  getAll: jest.spyOn(league, 'getAll'),
}

describe('GET: discover', () => {
  test('success - returns a list of leagues', () => {
    spies.getAll.mockImplementation(() => Promise.resolve([leagueMock]))
    return handler(null, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual([leagueMock])
        expect(result.statusCode).toEqual(200)
        expect(spies.getAll).toHaveBeenCalledTimes(1)
      })
  })
})
