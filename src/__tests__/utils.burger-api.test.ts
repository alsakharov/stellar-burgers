jest.mock('../utils/cookie', () => ({
  setCookie: jest.fn(),
  getCookie: jest.fn(),
  deleteCookie: jest.fn()
}));

import * as api from '../utils/burger-api';
import { getCookie, setCookie } from '../utils/cookie';

type MockFetchResp = { ok: boolean; json: () => Promise<unknown> };
const mkResp = (payload: unknown, ok = true): MockFetchResp => ({
  ok,
  json: () => Promise.resolve(payload)
});

/**
 * Простая реализация Storage для тестов
 */
class LocalStorageMock implements Storage {
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

describe('utils.burger-api', () => {
  const originalFetch = global.fetch;
  const originalLS = (global as unknown as { localStorage?: Storage })
    .localStorage;

  afterEach(() => {
    // Восстанавливаем оригинальные объекты с корректными типами
    global.fetch = originalFetch as typeof global.fetch;
    if (originalLS !== undefined) {
      (global as unknown as { localStorage: Storage }).localStorage =
        originalLS;
    } else {
      delete (global as unknown as Record<string, unknown>).localStorage;
    }
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // простая заглушка localStorage для тестов
    const lsMock = new LocalStorageMock();
    (global as unknown as { localStorage: Storage }).localStorage = lsMock;
  });

  describe('getIngredientsApi / getFeedsApi / getOrderByNumberApi', () => {
    it('getIngredientsApi — возвращает data при success=true', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true, data: [{ _id: 'i1' }] })
        ) as unknown as typeof global.fetch;
      const data = await api.getIngredientsApi();
      expect(Array.isArray(data)).toBe(true);
      expect((data[0] as { _id?: string })._id).toBe('i1');
    });

    it('getIngredientsApi — reject при success=false', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false, message: 'err' }, false)
        ) as unknown as typeof global.fetch;
      await expect(api.getIngredientsApi()).rejects.toBeDefined();
    });

    it('getFeedsApi — возвращает объект feeds при success=true', async () => {
      const payload = {
        success: true,
        orders: [{ _id: 'o1' }],
        total: 1,
        totalToday: 1
      };
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp(payload)) as unknown as typeof global.fetch;
      const res = await api.getFeedsApi();
      expect(res.orders).toBeDefined();
      expect(res.total).toBe(1);
    });

    it('getFeedsApi — reject при success=false', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false })
        ) as unknown as typeof global.fetch;
      await expect(api.getFeedsApi()).rejects.toBeDefined();
    });

    it('getOrderByNumberApi — success возвращает ответ', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true, orders: [{ _id: 'o' }] })
        ) as unknown as typeof global.fetch;
      const res = await api.getOrderByNumberApi(123);
      expect(res).toHaveProperty('orders');
    });

    it('getOrderByNumberApi — non-ok вызывает reject', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ message: 'not found' }, false)
        ) as unknown as typeof global.fetch;
      await expect(api.getOrderByNumberApi(999)).rejects.toBeDefined();
    });
  });

  describe('refreshToken / fetchWithRefresh (jwt flows)', () => {
    it('refreshToken — success сохраняет токены в localStorage и вызывает setCookie', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true, refreshToken: 'r', accessToken: 'a' })
        ) as unknown as typeof global.fetch;
      (global as unknown as { localStorage: Storage }).localStorage.setItem(
        'refreshToken',
        'old'
      );
      const res = await api.refreshToken();
      expect((res as { refreshToken?: string }).refreshToken).toBe('r');
      expect(
        (global as unknown as { localStorage: Storage }).localStorage.getItem(
          'refreshToken'
        )
      ).toBe('r');
      expect(setCookie).toHaveBeenCalled();
    });

    it('refreshToken — когда сервер вернул success=false -> reject', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false, message: 'bad' })
        ) as unknown as typeof global.fetch;
      await expect(api.refreshToken()).rejects.toBeDefined();
    });

    it('fetchWithRefresh — обычный успешный ответ', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true, foo: 'bar' })
        ) as unknown as typeof global.fetch;
      const r = await api.fetchWithRefresh('/x', {
        method: 'GET'
      } as RequestInit);
      expect(r).toEqual({ success: true, foo: 'bar' });
    });

    it('fetchWithRefresh — non-jwt non-ok ошибка -> reject без повторного вызова refresh', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ message: 'other' }, false)
        ) as unknown as typeof global.fetch;
      await expect(
        api.fetchWithRefresh('/x', { method: 'GET' } as RequestInit)
      ).rejects.toBeDefined();
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
    });

    it('fetchWithRefresh — jwt expired -> refresh success -> retry success', async () => {
      const first = mkResp({ message: 'jwt expired' }, false);
      const refreshResp = mkResp({
        success: true,
        refreshToken: 'r',
        accessToken: 'a'
      });
      const final = mkResp({ success: true, payload: 1 });
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(first) // initial
        .mockResolvedValueOnce(refreshResp) // refreshToken
        .mockResolvedValueOnce(final); // retry
      global.fetch = fetchMock as unknown as typeof global.fetch;
      (global as unknown as { localStorage: Storage }).localStorage.setItem(
        'refreshToken',
        'old'
      );
      const res = await api.fetchWithRefresh('/retry', {
        method: 'GET',
        headers: {}
      } as RequestInit);
      expect(res).toEqual({ success: true, payload: 1 });
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(3);
    });

    it('fetchWithRefresh — jwt expired -> refresh возвращает success:false -> reject', async () => {
      const first = mkResp({ message: 'jwt expired' }, false);
      const refreshResp = mkResp({ success: false, message: 'cant' }, true);
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(refreshResp);
      global.fetch = fetchMock as unknown as typeof global.fetch;
      (global as unknown as { localStorage: Storage }).localStorage.setItem(
        'refreshToken',
        'old'
      );
      await expect(
        api.fetchWithRefresh('/retry', {
          method: 'GET',
          headers: {}
        } as RequestInit)
      ).rejects.toBeDefined();
      expect(
        (global.fetch as jest.Mock).mock.calls.length
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe('fetchWithRefresh callers: getOrdersApi / orderBurgerApi / getUserApi / updateUserApi', () => {
    it('getOrdersApi — возвращает orders при success=true', async () => {
      jest
        .spyOn(api, 'fetchWithRefresh')
        .mockResolvedValue({ success: true, orders: [{ _id: 'o' }] });
      const orders = await api.getOrdersApi();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('getOrdersApi — reject при success=false', async () => {
      jest.spyOn(api, 'fetchWithRefresh').mockResolvedValue({ success: false });
      await expect(api.getOrdersApi()).rejects.toBeDefined();
    });

    it('orderBurgerApi — success path', async () => {
      (getCookie as jest.Mock).mockReturnValue('tok');
      jest
        .spyOn(api, 'fetchWithRefresh')
        .mockResolvedValue({ success: true, order: { number: 123 } });
      const res = await api.orderBurgerApi(['i1']);
      expect(res.success).toBe(true);
      expect(res.order.number).toBe(123);
    });

    it('orderBurgerApi — reject when success=false', async () => {
      (getCookie as jest.Mock).mockReturnValue('tok');
      jest.spyOn(api, 'fetchWithRefresh').mockResolvedValue({ success: false });
      await expect(api.orderBurgerApi(['i1'])).rejects.toBeDefined();
    });

    it('getUserApi / updateUserApi используют fetchWithRefresh и возвращают user', async () => {
      jest
        .spyOn(api, 'fetchWithRefresh')
        .mockResolvedValue({ success: true, user: { name: 'U' } });
      await expect(api.getUserApi()).resolves.toBeDefined();
      await expect(api.updateUserApi({ name: 'N' })).resolves.toBeDefined();
    });
  });

  describe('auth / password endpoints (register/login/forgot/reset/logout)', () => {
    it('registerUserApi/loginUserApi — success and failure paths', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mkResp({
          success: true,
          user: { email: 'a' },
          accessToken: 'Bearer a',
          refreshToken: 'r'
        })
      ) as unknown as typeof global.fetch;
      await expect(
        api.registerUserApi({ email: 'a', name: 'n', password: 'p' })
      ).resolves.toBeDefined();
      await expect(
        api.loginUserApi({ email: 'a', password: 'p' })
      ).resolves.toBeDefined();

      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false })
        ) as unknown as typeof global.fetch;
      await expect(
        api.registerUserApi({ email: 'a', name: 'n', password: 'p' })
      ).rejects.toBeDefined();
      await expect(
        api.loginUserApi({ email: 'a', password: 'p' })
      ).rejects.toBeDefined();
    });

    it('forgotPasswordApi / resetPasswordApi — success and failure', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true })
        ) as unknown as typeof global.fetch;
      await expect(
        api.forgotPasswordApi({ email: 'a' })
      ).resolves.toBeDefined();
      await expect(
        api.resetPasswordApi({ password: 'p', token: 't' })
      ).resolves.toBeDefined();

      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false })
        ) as unknown as typeof global.fetch;
      await expect(api.forgotPasswordApi({ email: 'a' })).rejects.toBeDefined();
      await expect(
        api.resetPasswordApi({ password: 'p', token: 't' })
      ).rejects.toBeDefined();
    });

    it('logoutApi — success and failure', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true })
        ) as unknown as typeof global.fetch;
      (global as unknown as { localStorage: Storage }).localStorage.setItem(
        'refreshToken',
        'r'
      );
      await expect(api.logoutApi()).resolves.toBeDefined();

      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: false }, false)
        ) as unknown as typeof global.fetch;
      await expect(api.logoutApi()).rejects.toBeDefined();
    });
  });
});
