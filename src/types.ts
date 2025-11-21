/**
 * Supported value types for serialization
 */
export type ValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'date'
  | 'regexp'
  | 'blob'
  | 'file'
  | 'arraybuffer';

/**
 * Serialized value envelope for localStorage
 */
export interface SerializedValue {
  /** Format version for future migrations */
  __v: 1;
  /** Type identifier */
  __t: ValueType;
  /** The actual data */
  data: unknown;
  /** Optional type-specific metadata */
  meta?: Record<string, unknown>;
}

/**
 * Storage error codes
 */
export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE' // No backend available
  | 'QUOTA_EXCEEDED' // Storage limit reached
  | 'INVALID_VALUE' // Unsupported data type
  | 'OPERATION_FAILED' // Generic operation failure
  | 'TIMEOUT' // Operation timed out
  | 'CORRUPTION' // Data corruption detected
  | 'VERSION_MISMATCH'; // DB version conflict

/**
 * Driver types
 */
export type Driver = 'indexeddb' | 'localstorage';

/**
 * Configuration options for creating a store instance
 */
export interface StoreConfig {
  /** Database name. Default: 'default' */
  name?: string;
  /** Object store name (IndexedDB only). Default: 'keyvaluepairs' */
  storeName?: string;
  /** Database version (IndexedDB only). Default: 1 */
  version?: number;
  /** Optional description */
  description?: string;
  /** Force a specific driver (for testing). Default: auto-detect */
  driver: Driver;
  /** Force eager initialization instead of lazy. Default: false */
  eager?: boolean;
}

/**
 * Storage driver interface - implemented by IndexedDB and localStorage drivers
 */
export interface StorageDriver {
  /** Driver name */
  readonly name: Driver;

  /** Initialize the driver (open connections, etc.) */
  init(): Promise<void>;

  /**
   * Get a value by key
   * @returns The value or null if not found
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * Remove a value by key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Remove all values
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;

  /**
   * Get the number of stored items
   */
  length(): Promise<number>;

  /**
   * Check if this driver is available
   * @returns true if the driver can be used
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Public API surface for storage instance
 */
export interface StorageInstance {
  /**
   * Get a value by key
   * @returns The value or null if not found
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * Set a value for a key
   */
  setItem<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value by key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Remove all values
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;

  /**
   * Get the number of stored items
   */
  length(): Promise<number>;

  /**
   * Get the name of the active storage driver
   * @returns 'indexeddb', 'localstorage', or 'uninitialized'
   */
  getDriver(): Driver | 'uninitialized';
}
