import { describe, expect, it } from 'vitest';
import { Serializer } from '../../src/core/serializer';
import { StorageError } from '../../src/errors';

describe('Serializer', () => {
  describe('primitives', () => {
    it('serializes and deserializes strings', async () => {
      const value = 'hello world';
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<string>(serialized);

      expect(deserialized).toBe(value);
    });

    it('serializes and deserializes numbers', async () => {
      const value = 12345;
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<number>(serialized);

      expect(deserialized).toBe(value);
    });

    it('serializes and deserializes booleans', async () => {
      const trueValue = true;
      const falseValue = false;

      const serializedTrue = await Serializer.serialize(trueValue);
      const serializedFalse = await Serializer.serialize(falseValue);

      expect(Serializer.deserialize<boolean>(serializedTrue)).toBe(true);
      expect(Serializer.deserialize<boolean>(serializedFalse)).toBe(false);
    });

    it('serializes and deserializes null', async () => {
      const serialized = await Serializer.serialize(null);
      const deserialized = Serializer.deserialize(serialized);

      expect(deserialized).toBe(null);
    });

    it('serializes and deserializes undefined', async () => {
      const serialized = await Serializer.serialize(undefined);
      const deserialized = Serializer.deserialize(serialized);

      expect(deserialized).toBe(undefined);
    });
  });

  describe('objects and arrays', () => {
    it('serializes and deserializes plain objects', async () => {
      const value = { name: 'John', age: 30, active: true };
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<typeof value>(serialized);

      expect(deserialized).toEqual(value);
    });

    it('serializes and deserializes nested objects', async () => {
      const value = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            email: 'john@example.com',
          },
        },
      };
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<typeof value>(serialized);

      expect(deserialized).toEqual(value);
    });

    it('serializes and deserializes arrays', async () => {
      const value = [1, 2, 3, 4, 5];
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<typeof value>(serialized);

      expect(deserialized).toEqual(value);
    });

    it('serializes and deserializes arrays of objects', async () => {
      const value = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<typeof value>(serialized);

      expect(deserialized).toEqual(value);
    });
  });

  describe('Date', () => {
    it('serializes and deserializes Date objects', async () => {
      const value = new Date('2024-01-15T10:30:00.000Z');
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<Date>(serialized);

      expect(deserialized).toBeInstanceOf(Date);
      expect(deserialized?.getTime()).toBe(value.getTime());
    });

    it('preserves Date precision', async () => {
      const value = new Date();
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<Date>(serialized);

      expect(deserialized?.getTime()).toBe(value.getTime());
    });
  });

  describe('RegExp', () => {
    it('serializes and deserializes RegExp objects', async () => {
      const value = /test/gi;
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<RegExp>(serialized);

      expect(deserialized).toBeInstanceOf(RegExp);
      expect(deserialized?.source).toBe(value.source);
      expect(deserialized?.flags).toBe(value.flags);
    });

    it('preserves RegExp flags', async () => {
      const patterns = [/test/, /test/i, /test/g, /test/m, /test/gimu];

      for (const pattern of patterns) {
        const serialized = await Serializer.serialize(pattern);
        const deserialized = Serializer.deserialize<RegExp>(serialized);

        expect(deserialized?.flags).toBe(pattern.flags);
      }
    });
  });

  describe('Blob', () => {
    it('serializes and deserializes Blob objects', async () => {
      const value = new Blob(['hello world'], { type: 'text/plain' });
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<Blob>(serialized);

      expect(deserialized).toBeInstanceOf(Blob);
      expect(deserialized?.type).toBe('text/plain');
      expect(deserialized?.size).toBe(11);

      const text = await deserialized!.text();
      expect(text).toBe('hello world');
    });

    it('preserves Blob MIME type', async () => {
      const types = ['text/plain', 'application/json', 'image/png', ''];

      for (const type of types) {
        const blob = new Blob(['test'], { type });
        const serialized = await Serializer.serialize(blob);
        const deserialized = Serializer.deserialize<Blob>(serialized);

        expect(deserialized?.type).toBe(type);
      }
    });
  });

  describe('File', () => {
    it('serializes and deserializes File objects', async () => {
      const value = new File(['file content'], 'test.txt', {
        type: 'text/plain',
        lastModified: 1234567890,
      });

      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<File>(serialized);

      expect(deserialized).toBeInstanceOf(File);
      expect(deserialized?.name).toBe('test.txt');
      expect(deserialized?.type).toBe('text/plain');
      expect(deserialized?.lastModified).toBe(1234567890);
      expect(deserialized?.size).toBe(12);

      const text = await deserialized!.text();
      expect(text).toBe('file content');
    });

    it('preserves all File metadata', async () => {
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
        lastModified: Date.now(),
      });

      const serialized = await Serializer.serialize(file);
      const deserialized = Serializer.deserialize<File>(serialized);

      expect(deserialized?.name).toBe(file.name);
      expect(deserialized?.type).toBe(file.type);
      expect(deserialized?.lastModified).toBe(file.lastModified);
      expect(deserialized?.size).toBe(file.size);
    });
  });

  describe('ArrayBuffer', () => {
    it('serializes and deserializes ArrayBuffer objects', async () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 1;
      view[1] = 2;
      view[7] = 255;

      const serialized = await Serializer.serialize(buffer);
      const deserialized = Serializer.deserialize<ArrayBuffer>(serialized);

      expect(deserialized).toBeInstanceOf(ArrayBuffer);
      expect(deserialized?.byteLength).toBe(8);

      const deserializedView = new Uint8Array(deserialized!);
      expect(deserializedView[0]).toBe(1);
      expect(deserializedView[1]).toBe(2);
      expect(deserializedView[7]).toBe(255);
    });
  });

  describe('TypedArrays', () => {
    it('serializes and deserializes Uint8Array', async () => {
      const value = new Uint8Array([1, 2, 3, 4, 5]);
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<ArrayBuffer>(serialized);

      expect(deserialized).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(deserialized!)).toEqual(value);
    });

    it('serializes and deserializes Float32Array', async () => {
      const value = new Float32Array([1.5, 2.5, 3.5]);
      const serialized = await Serializer.serialize(value);
      const deserialized = Serializer.deserialize<ArrayBuffer>(serialized);

      expect(deserialized).toBeInstanceOf(ArrayBuffer);
      expect(new Float32Array(deserialized!)).toEqual(value);
    });
  });

  describe('error handling', () => {
    it('throws for unsupported types', async () => {
      await expect(Serializer.serialize(() => {})).rejects.toThrow(
        StorageError
      );
      await expect(Serializer.serialize(Symbol('test'))).rejects.toThrow(
        StorageError
      );
      await expect(Serializer.serialize(new Map())).rejects.toThrow(
        StorageError
      );
    });

    it('returns null for corrupted data', () => {
      expect(Serializer.deserialize('invalid json')).toBe(null);
      expect(Serializer.deserialize('{malformed')).toBe(null);
      expect(Serializer.deserialize('null')).toBe(null);
    });

    it('throws for unsupported envelope version', () => {
      const invalidEnvelope = JSON.stringify({
        __v: 2,
        __t: 'string',
        data: 'test',
      });

      expect(() => Serializer.deserialize(invalidEnvelope)).toThrow(
        StorageError
      );
    });

    it('throws for unknown type in envelope', () => {
      const invalidEnvelope = JSON.stringify({
        __v: 1,
        __t: 'unknown_type',
        data: 'test',
      });

      expect(() => Serializer.deserialize(invalidEnvelope)).toThrow(
        StorageError
      );
    });
  });

  describe('envelope format', () => {
    it('creates correct envelope for primitives', async () => {
      const serialized = await Serializer.serialize('test');
      const envelope = JSON.parse(serialized) as {
        __v: number;
        __t: string;
        data: unknown;
      };

      expect(envelope).toHaveProperty('__v', 1);
      expect(envelope).toHaveProperty('__t', 'string');
      expect(envelope).toHaveProperty('data', 'test');
    });

    it('includes metadata for special types', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const serialized = await Serializer.serialize(blob);
      const envelope = JSON.parse(serialized) as {
        __v: number;
        __t: string;
        data: unknown;
        meta: { type: string; size: number };
      };

      expect(envelope).toHaveProperty('__v', 1);
      expect(envelope).toHaveProperty('__t', 'blob');
      expect(envelope).toHaveProperty('data');
      expect(envelope).toHaveProperty('meta');
      expect(envelope.meta).toHaveProperty('type', 'text/plain');
      expect(envelope.meta).toHaveProperty('size', 4);
    });
  });
});
