import uuidv4 from 'uuid/v4'

import { put, query, update as updateDynamo, createSet, safeProjection } from '../lib/dynamo'

import { create } from '../repositories/authorizer'

interface GetByIdOptions {
  sameUser?: boolean
  projection?: undefined | Array<string>
}

const createFromAuthResult = async (record: AuthResult): Promise<User> => {
  const userId = uuidv4()

  const {
    id,
    name,
    locale,
    pictureURL,
    email,
    authorizer,
  } = record

  const newUser = {
    id: userId,
    isActive: true,
    displayName: name,
    email,
    locale: locale || 'en-US',
    pictureURL,
    authorizers: {
      [authorizer]: {
        id,
        retrievedDate: new Date().toISOString(),
      },
    },
  } as User

  return put({
    Item: {
      ...newUser,
      leagues: createSet(['default']),
    },
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => create(id, authorizer, userId))
    .then(() => newUser)
}

const getById = async (
  userId: string,
  { sameUser = true, projection = undefined }: GetByIdOptions
): Promise<User> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(
    projection ||
    sameUser
      ? ['id', 'displayName', 'email', 'pictureURL', 'locale']
      : ['id', 'displayName', 'pictureURL']
  )

  return query({
    KeyConditionExpression: 'id = :userId',
    ExpressionAttributeNames,
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    TableName: process.env.DB_TABLE_USER,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as User)
}

const update = async (userId: string, values: Record<string, any>): Promise<void> => {
  return updateDynamo({
    Key: {
      id: userId,
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
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => null)
}

const addLeague = async (userId: string, leagueId: string): Promise<void> => {
  return updateDynamo({
    Key: {
      id: userId,
    },
    UpdateExpression: 'ADD #leagues :leagueId',
    ExpressionAttributeNames: {
      '#leagues': 'leagues',
    },
    ExpressionAttributeValues: {
      ':leagueId': [leagueId],
    },
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => null)
}

const removeLeague = async (userId: string, leagueId: string): Promise<void> => {
  return updateDynamo({
    Key: {
      id: userId,
    },
    UpdateExpression: 'DELETE #leagues :leagueId',
    ExpressionAttributeNames: {
      '#leagues': 'leagues',
    },
    ExpressionAttributeValues: {
      ':leagueId': [leagueId],
    },
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => null)
}

export {
  createFromAuthResult,
  getById,
  update,
  addLeague,
  removeLeague,
}
