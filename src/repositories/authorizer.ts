import { put, query } from '../lib/dynamo'

const create = async (authId: string, type: string, userId: string): Promise<void> => {
  return put({
    Item: {
      id: authId,
      type,
      userId,
    },
    TableName: process.env.DB_TABLE_AUTHORIZER,
  })
    .then(() => null)
}

const getUserIdByAuthId = async (id: string, type: string): Promise<string> => {
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
  create,
  getUserIdByAuthId,
}
