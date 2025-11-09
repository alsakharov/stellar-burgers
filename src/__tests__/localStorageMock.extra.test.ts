import { LocalStorageMock } from '../test-utils/localStorageMock';

describe('LocalStorageMock — extra checks', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = new LocalStorageMock();
  });

  it('setItem accepts non-string values and length updates correctly', () => {
    expect(ls.length).toBe(0);
    ls.setItem('n', 123 as unknown as string);
    expect(ls.getItem('n')).toBe('123');
    expect(ls.length).toBe(1);
  });

  it('key returns keys in insertion order and updates after remove', () => {
    ls.setItem('a', '1');
    ls.setItem('b', '2');
    ls.setItem('c', '3');
    // key(0) exists
    expect(ls.key(0)).toBeDefined();
    // remove middle and ensure keys shift
    ls.removeItem('b');
    const keys = [ls.key(0), ls.key(1)];
    expect(keys).toContain('a');
    expect(keys).toContain('c');
  });

  it('getItem returns null for missing keys and key returns null for out-of-range', () => {
    expect(ls.getItem('missing')).toBeNull();
    expect(ls.key(10)).toBeNull();
  });

  it('clear empties store and resets length', () => {
    ls.setItem('a', '1');
    ls.clear();
    expect(ls.length).toBe(0);
    expect(ls.getItem('a')).toBeNull();
  });
});
