import uuidv4 from 'uuid/v4'

import { put, query, update as updateDynamo, safeProjection } from '../lib/dynamo'

const create = async (league: League, user: User): Promise<League> => {
  const { id, displayName, pictureURL } = user
  const record = {
    ...league,
    id: uuidv4(),
    isActive: true,
    userCount: 1,
    users: {
      [id]: {
        id,
        displayName,
        pictureURL,
        isActive: true,
        role: LeagueRole.admin,
        score: 1000,
      },
    },
  }
  return put({
    Item: record,
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => record)
}

const update = async (leagueId: string, values: Record<string, any>): Promise<void> => {
  return updateDynamo({
    Key: {
      id: leagueId,
    },
    UpdateExpression: `SET ${Object.keys(values).map(a => `#${a} = :${a}`).join(',')}`,
    ExpressionAttributeNames: Object.keys(values).reduce(
      (a, c) => { a['#' + c] = c; return a },
      {} as Record<string, string>
    ),
    ExpressionAttributeValues: Object.keys(values).reduce(
      (a, c) => { a[':' + c] = values[c]; return a },
      {} as Record<string, any>
    ),
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

const getById = async (leagueId: string): Promise<League> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection([
    'id',
    'isActive',
    'displayName',
    'inviteCode',
    'userCount',
    'users',
    'description',
    'pictureURL',
  ])

  return query({
    KeyConditionExpression: 'id = :leagueId',
    ExpressionAttributeValues: {
      ':leagueId': leagueId,
    },
    ExpressionAttributeNames,
    TableName: process.env.DB_TABLE_LEAGUE,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as League)
}

const setUsers = async (leagueId: string, users: Record<string, LeagueUser>): Promise<void> => {
  return updateDynamo({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET userCount = :userCount,#users = :users',
    ExpressionAttributeNames: {
      '#users': 'users',
    },
    ExpressionAttributeValues: {
      ':users': users,
      ':userCount': Object.keys(users).length,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

const addUser = async (leagueId: string, user: User): Promise<void> => {
  const { id, displayName, pictureURL } = user
  return updateDynamo({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET #users.#userId = :user ADD userCount :increment',
    ExpressionAttributeNames: {
      '#users': 'users',
      '#userId': id,
    },
    ExpressionAttributeValues: {
      ':user': {
        id,
        displayName,
        pictureURL,
        isActive: true,
        score: 1000,
        role: LeagueRole.member,
      },
      ':increment': 1,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

const removeUser = async (leagueId: string, userId: string): Promise<void> => {
  return updateDynamo({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'REMOVE #users.#userId ADD userCount :decrement',
    ExpressionAttributeNames: {
      '#users': 'users',
      '#userId': userId,
    },
    ExpressionAttributeValues: {
      ':decrement': -1,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

interface ScoreUpdate {
  id: string
  score: number
}

const updateScores = async (leagueId: string, scores: Array<ScoreUpdate>): Promise<void> => {
  const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = scores.reduce((a, c, i) => {
    a.ExpressionAttributeNames['#user' + i] = c.id
    a.ExpressionAttributeValues[':userScore' + i] = c.score
    a.UpdateExpression.push(`#users.#user${i}.#score = :userScore${i}`)
    return a
  }, {
    ExpressionAttributeNames: {
      '#users': 'users',
      '#score': 'score',
    },
    ExpressionAttributeValues: {
    },
    UpdateExpression: [],
  } as {
    ExpressionAttributeNames: Record<string, string>
    ExpressionAttributeValues: Record<string, number>
    UpdateExpression: Array<string>
  })

  return updateDynamo({
    Key: {
      id: leagueId,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression: `SET ${UpdateExpression.join(',')}`,
  })
    .then(() => null)
}

const getAll = async (): Promise<Array<League>> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection([
    'id',
    'isActive',
    'displayName',
    'userCount',
    'description',
    'pictureURL',
  ])
  return scan({
    TableName: process.env.DB_TABLE_LEAGUE,
    ExpressionAttributeNames,
    ProjectionExpression,
  })
    .then(result => result.Items as Array<League>)
}

export {
  create,
  update,
  getById,
  getAll,
  setUsers,
  addUser,
  removeUser,
  updateScores,
  ScoreUpdate,
}
