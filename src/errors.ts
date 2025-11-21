import type { StorageErrorCode } from './types.js';

export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  public readonly context: Record<string, unknown> | undefined;
  public readonly originalError: Error | undefined;

  constructor(
    code: StorageErrorCode,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;

    // Maintain proper stack trace for where our error
    // was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }

  static isStorageError(error: unknown): error is StorageError {
    return error instanceof StorageError;
  }

  static fromNativeError(
    error: Error,
    context?: Record<string, unknown>
  ): StorageError {
    const errorName = error.name;

    if (errorName === 'QuotaExceededError') {
      return new StorageError(
        'QUOTA_EXCEEDED',
        'Storage quota exceeded. Consider clearing old data or using a smaller payload',
        context,
        error
      );
    }

    if (errorName === 'TimeoutError') {
      return new StorageError(
        'TIMEOUT',
        'Storage operation timed out after 5 seconds',
        context,
        error
      );
    }

    if (errorName === 'VersionError') {
      return new StorageError(
        'VERSION_MISMATCH',
        'Database version conflict. Close other tabs or refresh the page',
        context,
        error
      );
    }

    if (
      errorName === 'InvalidStateError' ||
      errorName === 'UnknownError' ||
      errorName === 'NotFoundError'
    ) {
      return new StorageError(
        'OPERATION_FAILED',
        `Storage operation failed: ${error.message}`,
        context,
        error
      );
    }

    return new StorageError(
      'OPERATION_FAILED',
      `Storage operation failed: ${error.message}`,
      context,
      error
    );
  }
}

export const StorageErrors = {
  unavailable: (message?: string): StorageError =>
    new StorageError(
      'STORAGE_UNAVAILABLE',
      message ||
        'No storage backend available. Both IndexedDB and localStorage are unavailable'
    ),

  quotaExceeded: (size?: number): StorageError =>
    new StorageError(
      'QUOTA_EXCEEDED',
      'Storage quota exceeded. Consider clearing old data or using a smaller payload',
      size ? { attemptedSize: size } : undefined
    ),

  invalidValue: (type: string): StorageError =>
    new StorageError(
      'INVALID_VALUE',
      `Cannot store value of type "${type}". Supported types: primitives, objects, arrays, Date, RegExp, Blob, File, ArrayBuffer, TypedArrays`
    ),

  timeout: (operation: string): StorageError =>
    new StorageError(
      'TIMEOUT',
      `Operation "${operation}" timed out after 5 seconds`
    ),

  corruption: (key: string): StorageError =>
    new StorageError(
      'CORRUPTION',
      `Data corruption detected for key "${key}". Returning null`,
      { key }
    ),

  invalidKey: (reason: string): StorageError =>
    new StorageError('INVALID_VALUE', `Invalid key: ${reason}`),
};
