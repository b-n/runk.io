jest.unmock('../../repositories/user')
jest.unmock('uuid/v4')
import { createFromAuthResult, getById, update, addLeague, removeLeague } from '../../repositories/user'

import * as dynamo from '../../lib/dynamo'

const spies = {
  put: jest.spyOn(dynamo, 'put'),
  query: jest.spyOn(dynamo, 'query'),
  update: jest.spyOn(dynamo, 'update'),
}

test('create', () => {
  spies.put.mockImplementation(() => Promise.resolve(null))

  return createFromAuthResult(
    {
      id: '111',
      name: 'bob ross',
      locale: 'gentle',
      pictureURL: 'http://picsum.photos/',
      email: 'ye.ol.bobby.rossy@example.com',
      authorizer: 'runky',
    }
  )
    .then(result => {
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        email: 'ye.ol.bobby.rossy@example.com',
        pictureURL: 'http://picsum.photos/',
      }))
      expect(spies.put).toHaveBeenCalledTimes(1)
      expect(spies.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expect.objectContaining({
          displayName: 'bob ross',
          email: 'ye.ol.bobby.rossy@example.com',
          id: expect.any(String),
        }),
      }))
    })
})

test('update', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return update(
    '123',
    {
      displayName: 'testing test',
      email: 'hello@example.com',
    }
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET #displayName = :displayName,#email = :email',
        ExpressionAttributeNames: {
          '#displayName': 'displayName',
          '#email': 'email',
        },
        ExpressionAttributeValues: {
          ':displayName': 'testing test',
          ':email': 'hello@example.com',
        },
      }))
    })
})

describe('getById', () => {
  test('doesnt exist', () => {
    spies.query.mockImplementation(() => Promise.resolve({ Count: 0 }))

    return getById('123', { sameUser: true })
      .then(result => {
        expect(result).toEqual(null)
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })

  test('same user', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Count: 1,
      Items: [{ id: 'abc' }],
    }))

    return getById('123', { sameUser: true })
      .then(result => {
        expect(result).toEqual({ id: 'abc' })
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })

  test('different user', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Count: 1,
      Items: [{ id: 'abc' }],
    }))

    return getById('123', { sameUser: false })
      .then(result => {
        expect(result).toEqual({ id: 'abc' })
        expect(spies.query).toHaveBeenCalledTimes(1)
      })
  })
})

test('addLeague', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return addLeague(
    'abc',
    '123'
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'ADD #leagues :leagueId',
        ExpressionAttributeNames: {
          '#leagues': 'leagues',
        },
        ExpressionAttributeValues: {
          ':leagueId': ['123'],
        },
      }))
    })
})

test('removeLeague', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return removeLeague(
    'abc',
    '123'
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'DELETE #leagues :leagueId',
        ExpressionAttributeNames: {
          '#leagues': 'leagues',
        },
        ExpressionAttributeValues: {
          ':leagueId': ['123'],
        },
      }))
    })
})
