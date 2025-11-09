import { fetchWithRefresh } from '../utils/burger-api';

describe('fetchWithRefresh jwt expired flow', () => {
  const originalFetch = global.fetch;
  const originalLS = (global as unknown as { localStorage?: Storage })
    .localStorage;

  beforeEach(() => {
    // реализуем простой LocalStorage mock как класс, который соответствует интерфейсу Storage
    class TestLocalStorage implements Storage {
      private store: Record<string, string> = {};
      length = 0;

      clear(): void {
        this.store = {};
        this.length = 0;
      }

      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(this.store, key)
          ? this.store[key]
          : null;
      }

      setItem(key: string, value: string): void {
        this.store[key] = String(value);
        this.length = Object.keys(this.store).length;
      }

      removeItem(key: string): void {
        delete this.store[key];
        this.length = Object.keys(this.store).length;
      }

      key(index: number): string | null {
        return Object.keys(this.store)[index] ?? null;
      }
    }

    const ls = new TestLocalStorage();
    (global as unknown as { localStorage: Storage }).localStorage = ls;
  });

  afterEach(() => {
    // восстанавливаем original fetch и localStorage
    global.fetch = originalFetch;
    (global as unknown as { localStorage?: Storage }).localStorage = originalLS;
    jest.restoreAllMocks();
  });

  it('retries after jwt expired and succeeds', async () => {
    // 1) первый fetch отклоняется с ошибкой 'jwt expired'
    const jwtErr = new Error('jwt expired');

    // 2) refreshToken fetch возвращает успешный ответ (refreshToken + accessToken)
    const refreshResp = {
      ok: true,
      json: async () => ({
        success: true,
        refreshToken: 'rt',
        accessToken: 'at'
      })
    };

    // 3) финальный fetch возвращает данные
    const finalResp = {
      ok: true,
      json: async () => ({ success: true, data: 'ok' })
    };

    // Мокаем последовательность вызовов fetch:
    // первый — reject(jwtErr), второй — refreshResp, третий — finalResp
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(jwtErr) // первая попытка — reject
      .mockResolvedValueOnce(refreshResp) // запрос refreshToken
      .mockResolvedValueOnce(finalResp); // повторный запрос — success

    // Подставляем mock в global.fetch (через приведение типов)
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchWithRefresh<{ data: string }>(
      'https://example.test/x',
      {
        headers: {}
      } as RequestInit
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('data', 'ok');
    // убеждаемся, что fetch вызвался как минимум три раза
    expect(
      (global.fetch as unknown as jest.Mock).mock.calls.length
    ).toBeGreaterThanOrEqual(3);
  });
});
