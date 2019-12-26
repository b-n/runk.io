import uuidv4 from 'uuid/v4'

import { put, update, query } from './lib/dynamo'

import { getUserAuthorizerFromAuthResult } from './authorizer'

const userTable = process.env.DB_TABLE_USER

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
    displayName: name,
    email,
    locale: locale || 'en-US',
    pictureURL,
    authorizers: {},
  } as User

  return put({
    Item: newUser,
    TableName: userTable,
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

const updateAuth = async (
  userId: string,
  result: AuthResult,
  refreshToken: string
): Promise<UserAuthorizer> => {
  const { authorizer } = result
  const details = getUserAuthorizerFromAuthResult(result)

  return update({
    Key: {
      id: userId,
    },
    UpdateExpression: 'SET authorizers.#authorizer = :detail, refreshToken = :refreshToken',
    ExpressionAttributeNames: {
      '#authorizer': authorizer.toLowerCase(),
    },
    ExpressionAttributeValues: {
      ':detail': details,
      ':refreshToken': refreshToken,
    },
    TableName: userTable,
  })
    .then(() => details)
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

export {
  getUserIdFromAuthId,
  createUserFromAuth,
  updateAuth,
}
