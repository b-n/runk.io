export const update = jest.fn().mockImplementation(() => Promise.resolve())
export const put = jest.fn().mockImplementation(() => Promise.resolve())
export const query = jest.fn().mockImplementation(() => Promise.resolve())
export const scan = jest.fn().mockImplementation(() => Promise.resolve())
export const safeProjection = jest.fn().mockImplementation(() => ({ ProjectionExpression: '', ExpressionAttributeNames: {} }))
export const createSet = jest.fn()
