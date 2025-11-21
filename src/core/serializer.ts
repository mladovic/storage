import type { SerializedValue } from '../types.js';
import { StorageError, StorageErrors } from '../errors.js';
import { getTypeName, isPlainObject, isSerializable } from '../validation.js';

export class Serializer {
  static async serialize(value: unknown): Promise<string> {
    if (!isSerializable(value)) {
      throw StorageErrors.invalidValue(getTypeName(value));
    }

    const envelope = await this.createEnvelope(value);
    return JSON.stringify(envelope);
  }

  static deserialize<T>(json: string): T | null {
    try {
      const envelope = JSON.parse(json) as SerializedValue;
      return this.extractValue<T>(envelope);
    } catch (error) {
      // Re-throw StorageErrors (validation errors)
      if (error instanceof StorageError) {
        throw error;
      }
      // Return null for parsing errors (corrupted data)
      console.warn('Failed to deserialize value, returning null', error);
      return null;
    }
  }

  private static async createEnvelope(
    value: unknown
  ): Promise<SerializedValue> {
    if (value === null) {
      return { __v: 1, __t: 'null', data: null };
    }

    if (value === undefined) {
      return { __v: 1, __t: 'undefined', data: null };
    }

    const primitiveType = typeof value;
    if (primitiveType === 'string') {
      return { __v: 1, __t: 'string', data: value };
    }
    if (primitiveType === 'number') {
      return { __v: 1, __t: 'number', data: value };
    }
    if (primitiveType === 'boolean') {
      return { __v: 1, __t: 'boolean', data: value };
    }

    if (value instanceof Date) {
      return {
        __v: 1,
        __t: 'date',
        data: value.toISOString(),
      };
    }

    if (value instanceof RegExp) {
      return {
        __v: 1,
        __t: 'regexp',
        data: value.source,
        meta: { flags: value.flags },
      };
    }

    if (value instanceof File) {
      return this.serializeFile(value);
    }

    if (value instanceof Blob) {
      return this.serializeBlob(value);
    }

    if (value instanceof ArrayBuffer) {
      return this.serializeArrayBuffer(value);
    }

    if (ArrayBuffer.isView(value)) {
      return this.serializeTypedArray(value);
    }

    if (Array.isArray(value)) {
      return { __v: 1, __t: 'array', data: value };
    }

    if (isPlainObject(value)) {
      return { __v: 1, __t: 'object', data: value };
    }

    throw StorageErrors.invalidValue(getTypeName(value));
  }

  private static async serializeBlob(blob: Blob): Promise<SerializedValue> {
    const base64 = await this.blobToBase64(blob);
    return {
      __v: 1,
      __t: 'blob',
      data: base64,
      meta: {
        type: blob.type,
        size: blob.size,
      },
    };
  }

  private static async serializeFile(file: File): Promise<SerializedValue> {
    const base64 = await this.blobToBase64(file);
    return {
      __v: 1,
      __t: 'file',
      data: base64,
      meta: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      },
    };
  }

  private static serializeArrayBuffer(buffer: ArrayBuffer): SerializedValue {
    const base64 = this.arrayBufferToBase64(buffer);
    return {
      __v: 1,
      __t: 'arraybuffer',
      data: base64,
      meta: {
        byteLength: buffer.byteLength,
      },
    };
  }

  private static serializeTypedArray(
    typedArray: ArrayBufferView
  ): SerializedValue {
    const buffer = typedArray.buffer.slice(
      typedArray.byteOffset,
      typedArray.byteOffset + typedArray.byteLength
    );
    return this.serializeArrayBuffer(buffer as ArrayBuffer);
  }

  private static extractValue<T>(envelope: SerializedValue): T | null {
    if (envelope.__v !== 1) {
      throw new StorageError(
        'CORRUPTION',
        `Unsupported envelope format version: ${String(envelope.__v)}`
      );
    }

    const type = envelope.__t;
    const data = envelope.data;
    const meta = envelope.meta;

    switch (type) {
      case 'null':
        return null;

      case 'undefined':
        return undefined as T;

      case 'string':
      case 'number':
      case 'boolean':
        return data as T;

      case 'object':
      case 'array':
        return data as T;

      case 'date':
        return new Date(data as string) as T;

      case 'regexp':
        return new RegExp(data as string, meta?.flags as string) as T;

      case 'blob':
        return this.base64ToBlob(
          data as string,
          meta?.type as string | undefined
        ) as T;

      case 'file':
        return this.base64ToFile(
          data as string,
          meta?.name as string,
          meta?.type as string,
          meta?.lastModified as number
        ) as T;

      case 'arraybuffer':
        return this.base64ToArrayBuffer(data as string) as T;

      default:
        throw new StorageError(
          'CORRUPTION',
          `Unknown type in envelope: ${String(type)}`
        );
    }
  }

  // ===== Conversion Utilities =====

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to convert Blob to base64'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () =>
        reject(new Error(reader.error?.message || 'Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  private static base64ToBlob(base64: string, type?: string): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: type || '' });
  }

  private static base64ToFile(
    base64: string,
    name: string,
    type: string,
    lastModified: number
  ): File {
    const blob = this.base64ToBlob(base64, type);
    return new File([blob], name, { type, lastModified });
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] as number);
    }

    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }
}
