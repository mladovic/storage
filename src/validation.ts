import { StorageErrors } from './errors.js';

export function validateKey(key: unknown): asserts key is string {
  if (typeof key !== 'string') {
    throw StorageErrors.invalidKey(`Key must be a string, got ${typeof key}`);
  }

  if (key.length === 0) {
    throw StorageErrors.invalidKey('Key cannot be empty');
  }

  if (key.length > 1000) {
    throw StorageErrors.invalidKey(
      `Key too long (${key.length} characters). Maximum is 1000 characters`
    );
  }
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}

export function isSerializable(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (value instanceof Date) return true;
  if (value instanceof RegExp) return true;
  if (value instanceof Blob) return true;
  if (value instanceof File) return true;
  if (value instanceof ArrayBuffer) return true;
  if (ArrayBuffer.isView(value)) return true;

  if (Array.isArray(value)) {
    return value.every((item) => isSerializable(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).every((item) => isSerializable(item));
  }

  return false;
}

export function getTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (value instanceof RegExp) return 'RegExp';
  if (value instanceof File) return 'File';
  if (value instanceof Blob) return 'Blob';
  if (value instanceof ArrayBuffer) return 'ArrayBuffer';
  if (ArrayBuffer.isView(value)) {
    return value.constructor.name; // Uint8Array, Float32Array, etc.
  }

  const type = typeof value;
  if (type === 'object') {
    return value.constructor?.name || 'Object';
  }

  return type;
}
