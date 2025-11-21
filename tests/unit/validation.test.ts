import { describe, expect, it } from 'vitest';
import {
  getTypeName,
  isPlainObject,
  isSerializable,
  validateKey,
} from '../../src/validation';
import { StorageError } from '../../src/errors';

describe('validateKey', () => {
  it('accepts valid string keys', () => {
    expect(() => validateKey('valid-key')).not.toThrow();
    expect(() => validateKey('key with spaces')).not.toThrow();
    expect(() => validateKey('key:with:colons')).not.toThrow();
    expect(() => validateKey('key/with/slashes')).not.toThrow();
    expect(() => validateKey('emoji-🎉-key')).not.toThrow();
  });

  it('rejects non-string keys', () => {
    expect(() => validateKey(123)).toThrow(StorageError);
    expect(() => validateKey(null)).toThrow(StorageError);
    expect(() => validateKey(undefined)).toThrow(StorageError);
    expect(() => validateKey({})).toThrow(StorageError);
    expect(() => validateKey([])).toThrow(StorageError);
  });

  it('rejects empty string keys', () => {
    expect(() => validateKey('')).toThrow(StorageError);
    expect(() => validateKey('')).toThrow(/empty/i);
  });

  it('rejects keys that are too long', () => {
    const longKey = 'x'.repeat(1001);
    expect(() => validateKey(longKey)).toThrow(StorageError);
    expect(() => validateKey(longKey)).toThrow(/too long/i);
  });

  it('accepts keys at the maximum length', () => {
    const maxKey = 'x'.repeat(1000);
    expect(() => validateKey(maxKey)).not.toThrow();
  });
});

describe('isPlainObject', () => {
  it('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1, b: 2 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(new Object())).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it('returns false for special objects', () => {
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new RegExp('test'))).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
    expect(isPlainObject(new Set())).toBe(false);
  });

  it('returns false for class instances', () => {
    class MyClass {}
    expect(isPlainObject(new MyClass())).toBe(false);
  });
});

describe('isSerializable', () => {
  it('returns true for primitives', () => {
    expect(isSerializable(null)).toBe(true);
    expect(isSerializable(undefined)).toBe(true);
    expect(isSerializable('string')).toBe(true);
    expect(isSerializable(123)).toBe(true);
    expect(isSerializable(true)).toBe(true);
    expect(isSerializable(false)).toBe(true);
  });

  it('returns true for plain objects', () => {
    expect(isSerializable({})).toBe(true);
    expect(isSerializable({ a: 1, b: 'test' })).toBe(true);
    expect(isSerializable({ nested: { value: 123 } })).toBe(true);
  });

  it('returns true for arrays', () => {
    expect(isSerializable([])).toBe(true);
    expect(isSerializable([1, 2, 3])).toBe(true);
    expect(isSerializable(['a', 'b', 'c'])).toBe(true);
    expect(isSerializable([{ a: 1 }, { b: 2 }])).toBe(true);
  });

  it('returns true for special supported types', () => {
    expect(isSerializable(new Date())).toBe(true);
    expect(isSerializable(new RegExp('test'))).toBe(true);
    expect(isSerializable(new Blob(['test']))).toBe(true);
    expect(isSerializable(new File(['test'], 'test.txt'))).toBe(true);
    expect(isSerializable(new ArrayBuffer(8))).toBe(true);
    expect(isSerializable(new Uint8Array(8))).toBe(true);
    expect(isSerializable(new Float32Array(8))).toBe(true);
  });

  it('returns false for functions', () => {
    expect(isSerializable(() => {})).toBe(false);
    expect(isSerializable(function () {})).toBe(false);
  });

  it('returns false for symbols', () => {
    expect(isSerializable(Symbol('test'))).toBe(false);
  });

  it('returns false for class instances', () => {
    class MyClass {}
    expect(isSerializable(new MyClass())).toBe(false);
  });

  it('returns false for Map and Set', () => {
    expect(isSerializable(new Map())).toBe(false);
    expect(isSerializable(new Set())).toBe(false);
  });

  it('recursively checks array elements', () => {
    expect(isSerializable([1, 2, () => {}])).toBe(false);
    expect(isSerializable([1, 2, Symbol('test')])).toBe(false);
  });

  it('recursively checks object values', () => {
    expect(isSerializable({ a: 1, b: () => {} })).toBe(false);
    expect(isSerializable({ a: 1, b: Symbol('test') })).toBe(false);
  });
});

describe('getTypeName', () => {
  it('returns correct names for primitives', () => {
    expect(getTypeName(null)).toBe('null');
    expect(getTypeName(undefined)).toBe('undefined');
    expect(getTypeName('string')).toBe('string');
    expect(getTypeName(123)).toBe('number');
    expect(getTypeName(true)).toBe('boolean');
  });

  it('returns correct names for special types', () => {
    expect(getTypeName([])).toBe('Array');
    expect(getTypeName(new Date())).toBe('Date');
    expect(getTypeName(new RegExp('test'))).toBe('RegExp');
    expect(getTypeName(new Blob(['test']))).toBe('Blob');
    expect(getTypeName(new File(['test'], 'test.txt'))).toBe('File');
    expect(getTypeName(new ArrayBuffer(8))).toBe('ArrayBuffer');
  });

  it('returns correct names for TypedArrays', () => {
    expect(getTypeName(new Uint8Array(8))).toBe('Uint8Array');
    expect(getTypeName(new Uint16Array(8))).toBe('Uint16Array');
    expect(getTypeName(new Float32Array(8))).toBe('Float32Array');
    expect(getTypeName(new Float64Array(8))).toBe('Float64Array');
  });

  it('returns constructor name for custom classes', () => {
    class MyClass {}
    expect(getTypeName(new MyClass())).toBe('MyClass');
  });

  it('returns Object for plain objects', () => {
    expect(getTypeName({})).toBe('Object');
    expect(getTypeName({ a: 1 })).toBe('Object');
  });

  it('returns function for functions', () => {
    expect(getTypeName(() => {})).toBe('function');
    expect(getTypeName(function () {})).toBe('function');
  });
});
