jest.unmock('../../user/get')
jest.unmock('../../lib/middleware')
import { handler } from '../../user/get'

import * as user from '../../repositories/user'

import eventHttp from '../fixtures/eventHttp.json'
import userStub from '../fixtures/user.json'

const spies = {
  getById: jest.spyOn(user, 'getById'),
}

describe('GET: user', () => {
  test('gets current user details', () => {
    const queryResult = {
      ...userStub,
      id: '123',
    }
    spies.getById.mockImplementation(() => Promise.resolve(queryResult))

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
        expect(JSON.parse(result.body)).toEqual(queryResult)
        expect(result.statusCode).toEqual(200)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledWith('123', { sameUser: true })
      })
  })
})

describe('GET: user/{id}', () => {
  test('ERROR: user doesn\'t exist', () => {
    spies.getById.mockImplementation(() => Promise.resolve(null))
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
    const queryResult = {
      ...userStub,
      id: '234',
    }
    spies.getById.mockImplementation(() => Promise.resolve(queryResult))
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
        expect(JSON.parse(result.body)).toEqual(queryResult)
        expect(result.statusCode).toEqual(200)
        expect(spies.getById).toHaveBeenCalledTimes(1)
        expect(spies.getById).toHaveBeenCalledWith('234', { sameUser: false })
      })
  })
})
