import { describe, expect, it } from 'vitest'
import {
  encode,
  failure,
  INVALID_PARAMS,
  isJsonRpcRequest,
  isNotification,
  JSONRPC_VERSION,
  RpcError,
  splitLines,
  success,
} from '../src/protocol'

describe('isJsonRpcRequest', () => {
  it('accepts a request', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: 'ping' })).toBe(true)
  })

  it('accepts a notification, which has no id', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBe(true)
  })

  it('accepts a string id, which the spec allows', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 'abc', method: 'ping' })).toBe(true)
  })

  it('rejects the wrong protocol version', () => {
    expect(isJsonRpcRequest({ jsonrpc: '1.0', id: 1, method: 'ping' })).toBe(false)
  })

  it('rejects a missing or empty method', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 1 })).toBe(false)
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: '' })).toBe(false)
  })

  it('rejects an id that is neither string nor number', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: {}, method: 'ping' })).toBe(false)
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: true, method: 'ping' })).toBe(false)
  })

  it('rejects params that are not an object', () => {
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: 'ping', params: [] })).toBe(false)
    expect(isJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: 'ping', params: 'no' })).toBe(false)
  })

  it('rejects an array, so a JSON-RPC batch is not mistaken for a request', () => {
    expect(isJsonRpcRequest([{ jsonrpc: '2.0', id: 1, method: 'ping' }])).toBe(false)
  })

  it('rejects the things that are not messages at all', () => {
    for (const value of [null, undefined, 3, 'ping', true]) {
      expect(isJsonRpcRequest(value)).toBe(false)
    }
  })
})

describe('isNotification', () => {
  it('is true when there is no id to answer', () => {
    expect(isNotification({ jsonrpc: JSONRPC_VERSION, method: 'x' })).toBe(true)
    expect(isNotification({ jsonrpc: JSONRPC_VERSION, id: null, method: 'x' })).toBe(true)
  })

  it('is false for id 0, which is a real id', () => {
    expect(isNotification({ jsonrpc: JSONRPC_VERSION, id: 0, method: 'x' })).toBe(false)
  })
})

describe('success and failure', () => {
  it('quotes the id back', () => {
    expect(success(7, { ok: true })).toEqual({ jsonrpc: '2.0', id: 7, result: { ok: true } })
  })

  it('omits data when there is none, rather than sending undefined', () => {
    const response = failure(1, INVALID_PARAMS, 'bad')
    expect(response.error).toEqual({ code: INVALID_PARAMS, message: 'bad' })
    expect('data' in response.error).toBe(false)
  })

  it('carries data when given', () => {
    expect(failure(1, INVALID_PARAMS, 'bad', { uri: 'x' }).error.data).toEqual({ uri: 'x' })
  })

  it('takes a null id, for a request too broken to have had one', () => {
    expect(failure(null, INVALID_PARAMS, 'bad').id).toBe(null)
  })
})

describe('encode', () => {
  it('ends every message with a newline, since that is the framing', () => {
    expect(encode(success(1, {}))).toBe('{"jsonrpc":"2.0","id":1,"result":{}}\n')
  })

  it('cannot break its own framing: a newline in a string is escaped', () => {
    const line = encode(success(1, { text: 'a\nb' }))
    expect(line.split('\n')).toHaveLength(2)
    expect(JSON.parse(line)).toMatchObject({ result: { text: 'a\nb' } })
  })
})

describe('splitLines', () => {
  it('returns whole lines and keeps the remainder', () => {
    expect(splitLines('{"a":1}\n{"b":2}\n{"c"')).toEqual({
      lines: ['{"a":1}', '{"b":2}'],
      rest: '{"c"',
    })
  })

  it('holds everything back until a newline arrives', () => {
    expect(splitLines('{"a":1}')).toEqual({ lines: [], rest: '{"a":1}' })
  })

  it('drops blank lines rather than reporting them as messages', () => {
    expect(splitLines('{"a":1}\n\n  \n{"b":2}\n').lines).toEqual(['{"a":1}', '{"b":2}'])
  })

  it('handles \\r\\n, which a Windows client may send', () => {
    expect(splitLines('{"a":1}\r\n').lines).toEqual(['{"a":1}'])
  })
})

describe('RpcError', () => {
  it('carries a code and optional data to the wire', () => {
    const error = new RpcError(INVALID_PARAMS, 'nope', { why: 'testing' })
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe(INVALID_PARAMS)
    expect(error.message).toBe('nope')
    expect(error.data).toEqual({ why: 'testing' })
  })
})
