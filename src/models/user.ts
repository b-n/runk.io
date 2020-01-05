import uuidv4 from 'uuid/v4'

import authorizerModel from './authorizer'

import { put, update, query } from '../lib/dynamo'

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
    Item: newUser,
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => authorizerModel.create(id, authorizer, userId))
    .then(() => newUser)
}

const updateRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<string> => {
  return update({
    Key: {
      id: userId,
    },
    UpdateExpression: 'SET refreshToken = :refreshToken',
    ExpressionAttributeValues: {
      ':refreshToken': refreshToken,
    },
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => refreshToken)
}

const getById = async (userId: string): Promise<User> => {
  return query({
    KeyConditionExpression: 'id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    TableName: process.env.DB_TABLE_USER,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as User)
}

export default {
  getById,
  createFromAuthResult,
  updateRefreshToken,
}
