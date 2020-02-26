import { config as AWSConfig, DynamoDB } from 'aws-sdk'
import {
  DocumentClient,
} from 'aws-sdk/clients/dynamodb'

import config from '../../config'

AWSConfig.update({
  region: process.env.REGION,
})

const db = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  ...config.dynamodb,
})

const query =
  async (params: DocumentClient.QueryInput):
Promise<DocumentClient.QueryOutput> =>
    db.query(params).promise()

const scan =
  async (params: DocumentClient.ScanInput):
Promise<DocumentClient.ScanOutput> =>
    db.scan(params).promise()

const put =
  async (params: DocumentClient.PutItemInput):
Promise<DocumentClient.PutItemOutput> =>
    db.put(params).promise()

const update =
  async (params: DocumentClient.UpdateItemInput):
Promise<DocumentClient.UpdateItemOutput> =>
    db.update(params).promise()

interface SafeProjectionResult {
  ExpressionAttributeNames: {
    [name: string]: string
  }
  ProjectionExpression: string
}

const safeProjection = (items: Array<string>): SafeProjectionResult => {
  const result = items.reduce(
    (a, c) => { a.ExpressionAttributeNames[`#${c}`] = c; return a },
    { ExpressionAttributeNames: {}, ProjectionExpression: '' } as SafeProjectionResult
  )
  result.ProjectionExpression = Object.keys(result.ExpressionAttributeNames).join(',')

  return result
}

const createSet = (items: Array<any>) => {
  return db.createSet(items)
}

export {
  put,
  query,
  scan,
  update,
  safeProjection,
  createSet,
}
