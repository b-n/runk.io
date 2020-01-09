jest.unmock('../../user/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../user/get'

import * as dynamo from '../../lib/dynamo'

import eventHttp from '../fixtures/eventHttp.json'

const spies = {
  query: jest.spyOn(dynamo, 'query'),
}

describe('GET: user', () => {
  test('gets current user details', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Items: [{ id: '123' }],
      Count: 1,
    }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: {
          userId: '123',
        },
      },
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual({
          id: '123',
        })
        expect(result.statusCode).toEqual(200)
        expect(spies.query).toHaveBeenCalledTimes(1)
        expect(spies.query).toHaveBeenCalledWith(expect.objectContaining({
          ExpressionAttributeValues: {
            ':userId': '123',
          },
        }))
      })
  })
})

describe('GET: user/{id}', () => {
  test('ERROR: user doesn\'t exist', () => {
    spies.query.mockImplementation(() => Promise.resolve({ Count: 0 }))
    const event = {
      ...eventHttp,
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: {
          userId: '123',
        },
      },
    }

    return handler(event, null)
      .then(result => {
        expect(result.statusCode).toEqual(404)
      })
  })

  test('gets user details', () => {
    spies.query.mockImplementation(() => Promise.resolve({
      Items: [{ id: '234' }],
      Count: 1,
    }))
    const event = {
      ...eventHttp,
      pathParameters: {
        id: '234',
      },
      requestContext: {
        ...eventHttp.requestContext,
        authorizer: {
          userId: '123',
        },
      },
    }

    return handler(event, null)
      .then(result => {
        expect(JSON.parse(result.body)).toEqual({
          id: '234',
        })
        expect(result.statusCode).toEqual(200)
        expect(spies.query).toHaveBeenCalledTimes(1)
        expect(spies.query).toHaveBeenCalledWith(expect.objectContaining({
          ExpressionAttributeValues: {
            ':userId': '234',
          },
        }))
      })
  })
})
