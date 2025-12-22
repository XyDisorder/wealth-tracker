import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { v4 } from 'uuid';
import { format } from 'date-fns';

describe('Stack Configuration Test', () => {
  it('should have zod available', () => {
    const schema = z.string();
    expect(schema.parse('test')).toBe('test');
  });

  it('should have uuid available', () => {
    const id = v4();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should have date-fns available', () => {
    const date = new Date('2024-01-01');
    expect(format(date, 'yyyy-MM-dd')).toBe('2024-01-01');
  });
});
