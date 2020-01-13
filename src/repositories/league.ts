import uuidv4 from 'uuid/v4'

import { put, query, update as updateDynamo, safeProjection } from '../lib/dynamo'

const create = async (league: League, userId: string): Promise<League> => {
  const record = {
    ...league,
    id: uuidv4(),
    isActive: true,
    userCount: 1,
    users: [
      {
        id: userId,
        isActive: true,
        role: LeagueRole.admin,
        score: 1000,
      },
    ],
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
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'isActive', 'name', 'inviteCode', 'userCount', 'users'])

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

const setUsers = async (leagueId: string, users: Array<LeagueUser>): Promise<void> => {
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
      ':userCount': users.filter(user => user.isActive).length + 1,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

const addUser = async (leagueId: string, userId: string): Promise<void> => {
  return updateDynamo({
    Key: {
      id: leagueId,
    },
    UpdateExpression: 'SET userCount = userCount + :increment,#users = list_append(#users, :user)',
    ExpressionAttributeNames: {
      '#users': 'users',
    },
    ExpressionAttributeValues: {
      ':user': [{
        id: userId,
        isActive: true,
        score: 1000,
        role: LeagueRole.member,
      }],
      ':increment': 1,
    },
    TableName: process.env.DB_TABLE_LEAGUE,
  })
    .then(() => null)
}

export {
  create,
  update,
  getById,
  setUsers,
  addUser,
}
