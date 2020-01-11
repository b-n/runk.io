import { Response } from 'node-fetch'

const generateResponse = (response: any): Response => ({
  ok: true,
  json: () => null,
  headers: null,
  redirected: false,
  status: 200,
  statusText: 'OK',
  clone: () => null,
  blob: () => null,
  buffer: () => null,
  text: () => null,
  textConverted: () => null,
  arrayBuffer: () => null,
  body: null,
  bodyUsed: false,
  size: 0,
  timeout: 0,
  url: '',
  type: 'basic',
  ...response,
})

export { generateResponse }
