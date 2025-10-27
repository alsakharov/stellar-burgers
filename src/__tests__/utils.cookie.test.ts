import { getCookie, setCookie, deleteCookie } from '../utils/cookie';

describe('cookie utils', () => {
  let originalDescriptor: PropertyDescriptor | undefined;
  let lastSet = '';

  beforeEach(() => {
    lastSet = '';
    // перехватываем запись в document.cookie (чтобы видеть attributes)
    originalDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie'
    );
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () =>
        // возвращаем только пары name=value (поведение браузера)
        (lastSet.split(';') || [])
          .map((s) => s.split(';')[0].trim())
          .join('; '),
      set: (val: string) => {
        lastSet = val;
      }
    } as PropertyDescriptor);
  });

  afterEach(() => {
    // восстанавливаем
    if (originalDescriptor) {
      Object.defineProperty(document, 'cookie', originalDescriptor);
    } else {
      // @ts-ignore
      delete (document as any).cookie;
    }
  });

  it('setCookie записывает строку cookie (includes attrs)', () => {
    setCookie('a', '1', { path: '/', expires: 60, secure: true });
    expect(lastSet).toContain('a=');
    expect(lastSet).toContain('path=');
    expect(lastSet).toContain('expires=');
    expect(lastSet).toContain('secure');
  });

  it('getCookie возвращает значение по имени', () => {
    // имитируем наличие cookie (getter возвращает пары name=value)
    lastSet = 'foo=bar; a=1';
    expect(getCookie('foo')).toBe('bar');
    expect(getCookie('a')).toBe('1');
    expect(getCookie('missing')).toBeUndefined();
  });

  it('setCookie с Date сохраняет expires как строку', () => {
    const d = new Date(Date.now() + 1000 * 60);
    setCookie('dt', 'v', { expires: d });
    expect(lastSet).toContain('expires=');
  });

  it('deleteCookie вызывает setCookie с expires -1', () => {
    // перехватим запись
    deleteCookie('toDel');
    expect(lastSet).toContain('toDel=');
    expect(lastSet).toContain('expires=');
  });
});
