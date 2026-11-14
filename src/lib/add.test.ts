import { describe, expect, it } from 'vitest';
import { parseAddResult } from './api/client';
import { parseUrls } from './add';

describe('parseUrls', () => {
  it('splits lines, trims, dedupes', () => {
    expect(parseUrls('  magnet:?xt=a \r\n\nmagnet:?xt=b\nmagnet:?xt=a\n')).toEqual(['magnet:?xt=a', 'magnet:?xt=b']);
    expect(parseUrls('  \n')).toEqual([]);
  });
});

describe('parseAddResult', () => {
  it('reads 5.x json counts', () => {
    expect(parseAddResult('{"success_count":2,"failure_count":1}')).toEqual({ added: 2, failed: 1 });
  });
  it('treats an all-failed json result as an error', () => {
    expect(() => parseAddResult('{"success_count":0,"failure_count":1}')).toThrow();
    expect(() => parseAddResult('Fails.')).toThrow();
  });
  it('accepts the legacy Ok.', () => {
    expect(parseAddResult('Ok.')).toEqual({ added: 1, failed: 0 });
  });
});
