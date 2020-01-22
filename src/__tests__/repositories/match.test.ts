jest.unmock('../../repositories/match')
jest.unmock('uuid/v4')
import {
  create,
  getById,
  getByLeagueId,
} from '../../repositories/match'

import * as dynamo from '../../lib/dynamo'

import matchMock from '../fixtures/match.json'

const spies = {
  put: jest.spyOn(dynamo, 'put'),
  query: jest.spyOn(dynamo, 'query'),
}

test('create', () => {
  spies.put.mockImplementation(() => Promise.resolve(null))

  return create(matchMock)
    .then(result => {
      expect(result).toEqual(expect.objectContaining({
        ...matchMock,
        id: expect.any(String),
      }))
      expect(spies.put).toHaveBeenCalledTimes(1)
      expect(spies.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({
          ...matchMock,
          id: expect.any(String),
        }),
      }))
    })
})

describe('getById', () => {
  test('doesnt exist', () => {
    spies.query.mockImplementation(() => Promise.resolve({ Count: 0 }))

    return getById('123')
      .then(result => {
        expect(result).toEqual(null)
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })

  test('gets the match', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Count: 1,
      Items: [{ id: 'abc' }],
    }))

    return getById('123')
      .then(result => {
        expect(result).toEqual({ id: 'abc' })
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })
})

test('getByLeagueId', () => {
  spies.query.mockImplementation(() => Promise.resolve({
    Count: 1,
    Items: [{ id: 'abc' }],
  }))

  return getByLeagueId('123')
    .then(result => {
      expect(result).toEqual(expect.arrayContaining([{ id: 'abc' }]))
      expect(spies.query).toHaveBeenCalledTimes(1)
    })
})
