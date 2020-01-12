jest.unmock('../../repositories/authorizer')
import { create, getUserIdByAuthId } from '../../repositories/authorizer'

import * as dynamo from '../../lib/dynamo'

const spies = {
  put: jest.spyOn(dynamo, 'put'),
  query: jest.spyOn(dynamo, 'query'),
}

test('create', () => {
  spies.put.mockImplementation(() => Promise.resolve(null))

  return create('123', 'runk', 'abc')
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.put).toHaveBeenCalledTimes(1)
      expect(spies.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: {
          id: '123',
          type: 'runk',
          userId: 'abc',
        },
      }))
    })
})

describe('getUserIdByAuthId', () => {
  test('doesnt exist', () => {
    spies.query.mockImplementation(() => Promise.resolve({ Count: 0 }))

    return getUserIdByAuthId('123', 'runk')
      .then(result => {
        expect(result).toEqual(null)
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })

  test('gets the userId', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Count: 1,
      Items: [{ userId: 'abc' }],
    }))

    return getUserIdByAuthId('123', 'runk')
      .then(result => {
        expect(result).toEqual('abc')
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })
})
