jest.unmock('../../repositories/league')
jest.unmock('uuid/v4')
import {
  create,
  getById,
  update,
  addUser,
  removeUser,
  setUsers,
  updateScores,
} from '../../repositories/league'

import * as dynamo from '../../lib/dynamo'

import userMock from '../fixtures/user.json'
import leagueRoleMock from '../fixtures/leagueRole.json'

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
      pictureURL: 'wat up',
      inviteCode: null,
    },
    {
      ...userMock,
      id: 'abc',
    }
  )
    .then(result => {
      const expectedObject = expect.objectContaining({
        displayName: 'testing league',
        inviteCode: null,
        id: expect.any(String),
        userCount: 1,
        users: {
          abc: {
            id: 'abc',
            displayName: userMock.displayName,
            pictureURL: userMock.pictureURL,
            score: 1000,
            role: 'admin',
            isActive: true,
          },
        },
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
    {
      ...userMock,
      id: 'abc',
    }
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET #users.#userId = :user ADD userCount :increment',
        ExpressionAttributeNames: {
          '#users': 'users',
          '#userId': 'abc',
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':user': {
            ...leagueRoleMock,
            id: 'abc',
            displayName: '',
            pictureURL: '',
          },
        },
      }))
    })
})

test('removeUser', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))

  return removeUser(
    '123',
    'abc'
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'REMOVE #users.#userId ADD userCount :decrement',
        ExpressionAttributeNames: {
          '#users': 'users',
          '#userId': 'abc',
        },
        ExpressionAttributeValues: {
          ':decrement': -1,
        },
      }))
    })
})

test('setUsers', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))
  const users = {
    abc: { ...leagueRoleMock, id: 'abc', score: 1000, isActive: false, role: LeagueRole.member },
    bcd: { ...leagueRoleMock, id: 'bcd', score: 1005, isActive: true, role: LeagueRole.admin },
  }

  return setUsers(
    'abc',
    users
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
test('updateScores', () => {
  spies.update.mockImplementation(() => Promise.resolve(null))
  const scoreUpdates = [
    { id: 'abc', score: 567 },
    { id: 'bcd', score: 9001 },
  ]

  return updateScores(
    'abc',
    scoreUpdates
  )
    .then(result => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
      expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({
        UpdateExpression: 'SET #users.#user0.#score = :userScore0,#users.#user1.#score = :userScore1',
        ExpressionAttributeNames: {
          '#users': 'users',
          '#score': 'score',
          '#user0': 'abc',
          '#user1': 'bcd',
        },
        ExpressionAttributeValues: {
          ':userScore0': 567,
          ':userScore1': 9001,
        },
      }))
    })
})
