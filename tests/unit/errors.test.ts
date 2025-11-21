import { describe, expect, it } from 'vitest';
import { StorageError, StorageErrors } from '../../src/errors';

describe('StorageError', () => {
  it('creates error with code and message', () => {
    const error = new StorageError('INVALID_VALUE', 'Test message');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorageError);
    expect(error.name).toBe('StorageError');
    expect(error.code).toBe('INVALID_VALUE');
    expect(error.message).toBe('Test message');
    expect(error.context).toBeUndefined();
    expect(error.originalError).toBeUndefined();
  });

  it('includes context when provided', () => {
    const context = { key: 'test', size: 100 };
    const error = new StorageError('QUOTA_EXCEEDED', 'Quota exceeded', context);

    expect(error.context).toEqual(context);
  });

  it('includes original error when provided', () => {
    const originalError = new Error('Original');
    const error = new StorageError(
      'OPERATION_FAILED',
      'Operation failed',
      undefined,
      originalError
    );

    expect(error.originalError).toBe(originalError);
  });

  it('has a proper stack trace', () => {
    const error = new StorageError('INVALID_VALUE', 'Test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('StorageError');
  });

  describe('isStorageError', () => {
    it('returns true for StorageError instances', () => {
      const error = new StorageError('INVALID_VALUE', 'Test');
      expect(StorageError.isStorageError(error)).toBe(true);
    });

    it('returns false if regular error', () => {
      const error = new Error('Regular error');
      expect(StorageError.isStorageError(error)).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(StorageError.isStorageError('string')).toBe(false);
      expect(StorageError.isStorageError(123)).toBe(false);
      expect(StorageError.isStorageError(null)).toBe(false);
      expect(StorageError.isStorageError(undefined)).toBe(false);
    });
  });

  describe('fromNativeError', () => {
    it('maps QuotaExceededError', () => {
      const nativeError = new Error('Quota exceeded');
      nativeError.name = 'QuotaExceededError';

      const storageError = StorageError.fromNativeError(nativeError);

      expect(storageError.code).toBe('QUOTA_EXCEEDED');
      expect(storageError.message).toContain('quota');
      expect(storageError.originalError).toBe(nativeError);
    });

    it('maps TimeoutError', () => {
      const nativeError = new Error('Timeout');
      nativeError.name = 'TimeoutError';

      const storageError = StorageError.fromNativeError(nativeError);

      expect(storageError.code).toBe('TIMEOUT');
      expect(storageError.message).toContain('timed out');
    });

    it('maps VersionError', () => {
      const nativeError = new Error('Version conflict');
      nativeError.name = 'VersionError';

      const storageError = StorageError.fromNativeError(nativeError);

      expect(storageError.code).toBe('VERSION_MISMATCH');
      expect(storageError.message).toContain('version conflict');
    });

    it('maps unknown errors to OPERATION_FAILED', () => {
      const nativeError = new Error('Unknown error');
      nativeError.name = 'UnknownError';

      const storageError = StorageError.fromNativeError(nativeError);

      expect(storageError.code).toBe('OPERATION_FAILED');
      expect(storageError.message).toContain('Unknown error');
    });

    it('includes context when provided', () => {
      const nativeError = new Error('Test');
      const context = { key: 'test-key' };

      const storageError = StorageError.fromNativeError(nativeError, context);

      expect(storageError.context).toEqual(context);
    });
  });
});

describe('StorageErrors factory', () => {
  it('creates unavailable error', () => {
    const error = StorageErrors.unavailable();

    expect(error.code).toBe('STORAGE_UNAVAILABLE');
    expect(error.message).toContain('No storage backend available');
  });

  it('creates unavailable error with custom message', () => {
    const error = StorageErrors.unavailable('Custom message');

    expect(error.code).toBe('STORAGE_UNAVAILABLE');
    expect(error.message).toBe('Custom message');
  });

  it('creates quotaExceeded error', () => {
    const error = StorageErrors.quotaExceeded();

    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.message).toContain('quota exceeded');
  });

  it('includes size in quotaExceeded context', () => {
    const error = StorageErrors.quotaExceeded(1024);

    expect(error.context).toEqual({ attemptedSize: 1024 });
  });

  it('creates invalidValue error', () => {
    const error = StorageErrors.invalidValue('Function');

    expect(error.code).toBe('INVALID_VALUE');
    expect(error.message).toContain('Function');
    expect(error.message).toContain('Cannot store');
  });

  it('creates timeout error', () => {
    const error = StorageErrors.timeout('setItem');

    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toContain('setItem');
    expect(error.message).toContain('timed out');
  });

  it('creates corruption error', () => {
    const error = StorageErrors.corruption('my-key');

    expect(error.code).toBe('CORRUPTION');
    expect(error.message).toContain('my-key');
    expect(error.context).toEqual({ key: 'my-key' });
  });

  it('creates invalidKey error', () => {
    const error = StorageErrors.invalidKey('too long');

    expect(error.code).toBe('INVALID_VALUE');
    expect(error.message).toContain('Invalid key');
    expect(error.message).toContain('too long');
  });
});
