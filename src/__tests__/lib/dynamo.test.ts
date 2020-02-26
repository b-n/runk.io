jest.unmock('aws-sdk')
import AWS from 'aws-sdk'

// weirdly, jest.mock causes issues on sdk? wat? we'll do it ourselves instead
// jest.mock('aws-sdk')
const mockReturns = {
  query: Promise.resolve(null),
  scan: Promise.resolve(null),
  put: Promise.resolve(null),
  update: Promise.resolve(null),
  createSet: null,
} as any

const spies = {
  query: jest.fn().mockReturnValue({
    promise: jest.fn().mockImplementation(() => mockReturns.query),
  }),
  scan: jest.fn().mockReturnValue({
    promise: jest.fn().mockImplementation(() => mockReturns.scan),
  }),
  put: jest.fn().mockReturnValue({
    promise: jest.fn().mockImplementation(() => mockReturns.put),
  }),
  update: jest.fn().mockReturnValue({
    promise: jest.fn().mockImplementation(() => mockReturns.update),
  }),
  createSet: jest.fn().mockReturnValue(mockReturns.createSet),
} as Record<string, any>

AWS.DynamoDB.DocumentClient = jest.fn().mockImplementation(() => Object.keys(spies).reduce(
  (a, c) => { a[c] = spies[c]; return a },
  {} as Record<string, any>
))

jest.unmock('../../lib/dynamo')
import { createSet, safeProjection, query, scan, put, update } from '../../lib/dynamo'

test('safeProjection - generates a valid projection', () => {
  const result = safeProjection(['id', 'name'])

  expect(result.ProjectionExpression).toEqual('#id,#name')
  expect(result.ExpressionAttributeNames).toEqual({
    '#id': 'id',
    '#name': 'name',
  })
})

test('query', () => {
  const input = {
    Key: 'testing',
    TableName: 'testing',
  }

  return query(input)
    .then((result: any) => {
      expect(result).toEqual(null)
      expect(spies.query).toHaveBeenCalledTimes(1)
    })
})

test('scan', () => {
  const input = {
    TableName: 'testing',
  }

  return scan(input)
    .then((result: any) => {
      expect(result).toEqual(null)
      expect(spies.scan).toHaveBeenCalledTimes(1)
    })
})

test('put', () => {
  const input = {
    Item: { id: 'testing' },
    TableName: 'testing',
  }

  return put(input)
    .then((result: any) => {
      expect(result).toEqual(null)
      expect(spies.put).toHaveBeenCalledTimes(1)
    })
})

test('update', () => {
  const input = {
    Key: { id: 'testing' },
    TableName: 'testing',
  }

  return update(input)
    .then((result: any) => {
      expect(result).toEqual(null)
      expect(spies.update).toHaveBeenCalledTimes(1)
    })
})

test('createSet', () => {
  expect(createSet(['testing'])).toEqual(null)
  expect(spies.createSet).toHaveBeenCalledTimes(1)
})
