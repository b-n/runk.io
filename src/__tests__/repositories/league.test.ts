jest.unmock('../../repositories/league')
jest.unmock('uuid/v4')
import { create, getById, update, addUser, setUsers } from '../../repositories/league'

import * as dynamo from '../../lib/dynamo'

const spies = {
  put: jest.spyOn(dynamo, 'put'),
  query: jest.spyOn(dynamo, 'query'),
  update: jest.spyOn(dynamo, 'update'),
}

test('create', () => {
  spies.put.mockImplementation(() => Promise.resolve(null))

  return create(
    {
      displayName: 'testing league',
      inviteCode: null,
    },
    'abc'
  )
    .then(result => {
      const expectedObject = expect.objectContaining({
        displayName: 'testing league',
        inviteCode: null,
        id: expect.any(String),
        userCount: 1,
        users: expect.arrayContaining([{
          id: 'abc',
          score: 1000,
          role: 'admin',
          isActive: true,
        }]),
      })
      expect(result).toEqual(expectedObject)
      expect(spies.put).toHaveBeenCalledTimes(1)
      expect(spies.put).toHaveBeenCalledWith(expect.objectContaining({
        Item: expectedObject,
      }))
    })
})

test('update', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return update(
    '123',
    {
      displayName: 'testing test',
      inviteCode: '123',
    }
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET #displayName = :displayName,#inviteCode = :inviteCode',
        ExpressionAttributeNames: {
          '#displayName': 'displayName',
          '#inviteCode': 'inviteCode',
        },
        ExpressionAttributeValues: {
          ':displayName': 'testing test',
          ':inviteCode': '123',
        },
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

  test('gets the league', () => {
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

test('addUser', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return addUser(
    '123',
    'abc'
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET userCount = userCount + :increment,#users = list_append(#users, :user)',
        ExpressionAttributeNames: {
          '#users': 'users',
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':user': [{
            id: 'abc',
            score: 1000,
            isActive: true,
            role: 'member',
          }],
        },
      }))
    })
})

test('setUsers', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))
  const users = [
    { id: 'abc', score: 1000, isActive: false, role: LeagueRole.member },
    { id: 'bcd', score: 1005, isActive: true, role: LeagueRole.admin },
  ]

  return setUsers(
    users,
    'abc'
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET userCount = :userCount,#users = :users',
        ExpressionAttributeNames: {
          '#users': 'users',
        },
        ExpressionAttributeValues: {
          ':userCount': 2,
          ':users': users,
        },
      }))
    })
})
