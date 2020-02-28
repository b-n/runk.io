import uuidv4 from 'uuid/v4'

import { put, query, safeProjection } from '../lib/dynamo'

const create = async (match: Match): Promise<Match> => {
  const record = {
    ...match,
    id: uuidv4(),
  }
  return put({
    Item: record,
    TableName: process.env.DB_TABLE_MATCH,
  })
    .then(() => record)
}

const getById = async (matchId: string): Promise<Match> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'users', 'winner', 'date'])

  return query({
    KeyConditionExpression: 'id = :matchId',
    ExpressionAttributeValues: {
      ':matchId': matchId,
    },
    ExpressionAttributeNames,
    TableName: process.env.DB_TABLE_MATCH,
    ProjectionExpression,
  })
    .then(results => results.Count === 0 ? null : results.Items[0] as Match)
}

const getByLeagueId = async (leagueId: string): Promise<Array<Match>> => {
  const { ProjectionExpression, ExpressionAttributeNames } = safeProjection(['id', 'users', 'winner', 'date'])

  return query({
    KeyConditionExpression: 'leagueId = :leagueId',
    IndexName: 'leagueId-index',
    ExpressionAttributeValues: {
      ':leagueId': leagueId,
    },
    ExpressionAttributeNames,
    TableName: process.env.DB_TABLE_MATCH,
    ProjectionExpression,
  })
    .then(results => results.Items as Array<Match>)
}

export {
  create,
  getById,
  getByLeagueId,
}
