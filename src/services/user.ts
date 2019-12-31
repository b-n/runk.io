import addSeconds from 'date-fns/addSeconds'
import uuidv4 from 'uuid/v4'

import { put, update, query } from './lib/dynamo'

const createUserFromAuth = async (record: AuthResult): Promise<string> => {
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
      [authorizer]: getUserAuthorizerFromAuthResult(record),
    },
  } as User

  return put({
    Item: newUser,
    TableName: process.env.DB_TABLE_USER,
  })
    .then(() => setAuthUserId(id, authorizer, userId))
    .then(() => userId)
}

const setAuthUserId = async (authId: string, type: string, userId: string): Promise<string> => {
  return put({
    Item: {
      id: authId,
      type,
      userId,
    },
    TableName: process.env.DB_TABLE_AUTHORIZER,
  })
    .then(() => userId)
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

const getUserIdFromAuthId = async (id: string, type: string): Promise<string> => {
  return query({
    ExpressionAttributeValues: {
      ':id': id,
      ':type': type,
    },
    ExpressionAttributeNames: {
      '#type': 'type',
    },
    KeyConditionExpression: 'id = :id and #type = :type',
    TableName: process.env.DB_TABLE_AUTHORIZER,
  })
    .then(results => results.Count === 0 ? null : results.Items[0].userId)
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

const getUserAuthorizerFromAuthResult = ({
  id,
  accessToken,
  refreshToken,
  tokenType,
  expiresIn,
}: AuthResult): UserAuthorizer => ({
  id,
  accessToken,
  refreshToken,
  tokenType,
  retrievedDate: new Date().toISOString(),
  expires: addSeconds(new Date(), expiresIn).toISOString(),
})

export {
  getUserIdFromAuthId,
  getById,
  createUserFromAuth,
  updateRefreshToken,
}
