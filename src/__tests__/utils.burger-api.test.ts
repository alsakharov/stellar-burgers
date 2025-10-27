jest.mock('../utils/cookie', () => ({
  setCookie: jest.fn(),
  getCookie: jest.fn(),
  deleteCookie: jest.fn()
}));

import * as api from '../utils/burger-api';
import { getCookie, setCookie } from '../utils/cookie';

type MockFetchResp = { ok: boolean; json: () => Promise<any> };
const mkResp = (payload: any, ok = true): MockFetchResp => ({
  ok,
  json: () => Promise.resolve(payload)
});

describe('utils.burger-api', () => {
  const originalFetch = global.fetch;
  const originalLS = global.localStorage;
  afterEach(() => {
    global.fetch = originalFetch as any;
    // @ts-ignore
    global.localStorage = originalLS;
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // простая заглушка localStorage для тестов
    const store: Record<string, string> = {};
    // @ts-ignore
    global.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => delete store[k]
    };
  });

  describe('getIngredientsApi / getFeedsApi / getOrderByNumberApi', () => {
    it('getIngredientsApi — возвращает data при success=true', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: true, data: [{ _id: 'i1' }] }));
      const data = await api.getIngredientsApi();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]._id).toBe('i1');
    });

    it('getIngredientsApi — reject при success=false', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: false, message: 'err' }, false));
      await expect(api.getIngredientsApi()).rejects.toBeDefined();
    });

    it('getFeedsApi — возвращает объект feeds при success=true', async () => {
      const payload = {
        success: true,
        orders: [{ _id: 'o1' }],
        total: 1,
        totalToday: 1
      };
      global.fetch = jest.fn().mockResolvedValue(mkResp(payload));
      const res = await api.getFeedsApi();
      expect(res.orders).toBeDefined();
      expect(res.total).toBe(1);
    });

    it('getFeedsApi — reject при success=false', async () => {
      global.fetch = jest.fn().mockResolvedValue(mkResp({ success: false }));
      await expect(api.getFeedsApi()).rejects.toBeDefined();
    });

    it('getOrderByNumberApi — success возвращает ответ', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: true, orders: [{ _id: 'o' }] }));
      const res = await api.getOrderByNumberApi(123);
      expect(res).toHaveProperty('orders');
    });

    it('getOrderByNumberApi — non-ok вызывает reject', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ message: 'not found' }, false));
      await expect(api.getOrderByNumberApi(999)).rejects.toBeDefined();
    });
  });

  describe('refreshToken / fetchWithRefresh (jwt flows)', () => {
    it('refreshToken — success сохраняет токены в localStorage и вызывает setCookie', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          mkResp({ success: true, refreshToken: 'r', accessToken: 'a' })
        );
      // @ts-ignore
      localStorage.setItem('refreshToken', 'old');
      const res = await api.refreshToken();
      expect(res.refreshToken).toBe('r');
      // @ts-ignore
      expect(localStorage.getItem('refreshToken')).toBe('r');
      expect(setCookie).toHaveBeenCalled();
    });

    it('refreshToken — когда сервер вернул success=false -> reject', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: false, message: 'bad' }));
      // @ts-ignore
      await expect(api.refreshToken()).rejects.toBeDefined();
    });

    it('fetchWithRefresh — обычный успешный ответ', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: true, foo: 'bar' }));
      const r = await api.fetchWithRefresh('/x', { method: 'GET' } as any);
      expect(r).toEqual({ success: true, foo: 'bar' });
    });

    it('fetchWithRefresh — non-jwt non-ok ошибка -> reject без повторного вызова refresh', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ message: 'other' }, false));
      await expect(
        api.fetchWithRefresh('/x', { method: 'GET' } as any)
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
      global.fetch = fetchMock;
      // @ts-ignore
      localStorage.setItem('refreshToken', 'old');
      const res = await api.fetchWithRefresh('/retry', {
        method: 'GET',
        headers: {}
      } as any);
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
      global.fetch = fetchMock;
      // @ts-ignore
      localStorage.setItem('refreshToken', 'old');
      await expect(
        api.fetchWithRefresh('/retry', { method: 'GET', headers: {} } as any)
      ).rejects.toBeDefined();
      expect(
        (global.fetch as jest.Mock).mock.calls.length
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe('fetchWithRefresh callers: getOrdersApi / orderBurgerApi / getUserApi / updateUserApi', () => {
    it('getOrdersApi — возвращает orders при success=true', async () => {
      // @ts-ignore
      api.fetchWithRefresh = jest
        .fn()
        .mockResolvedValue({ success: true, orders: [{ _id: 'o' }] });
      const orders = await api.getOrdersApi();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('getOrdersApi — reject при success=false', async () => {
      // @ts-ignore
      api.fetchWithRefresh = jest.fn().mockResolvedValue({ success: false });
      await expect(api.getOrdersApi()).rejects.toBeDefined();
    });

    it('orderBurgerApi — success path', async () => {
      (getCookie as jest.Mock).mockReturnValue('tok');
      // @ts-ignore
      api.fetchWithRefresh = jest
        .fn()
        .mockResolvedValue({ success: true, order: { number: 123 } });
      const res = await api.orderBurgerApi(['i1']);
      expect(res.success).toBe(true);
      expect(res.order.number).toBe(123);
    });

    it('orderBurgerApi — reject when success=false', async () => {
      (getCookie as jest.Mock).mockReturnValue('tok');
      // @ts-ignore
      api.fetchWithRefresh = jest.fn().mockResolvedValue({ success: false });
      await expect(api.orderBurgerApi(['i1'])).rejects.toBeDefined();
    });

    it('getUserApi / updateUserApi используют fetchWithRefresh и возвращают user', async () => {
      // @ts-ignore
      api.fetchWithRefresh = jest
        .fn()
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
      );
      await expect(
        api.registerUserApi({ email: 'a', name: 'n', password: 'p' })
      ).resolves.toBeDefined();
      await expect(
        api.loginUserApi({ email: 'a', password: 'p' })
      ).resolves.toBeDefined();

      global.fetch = jest.fn().mockResolvedValue(mkResp({ success: false }));
      await expect(
        api.registerUserApi({ email: 'a', name: 'n', password: 'p' })
      ).rejects.toBeDefined();
      await expect(
        api.loginUserApi({ email: 'a', password: 'p' })
      ).rejects.toBeDefined();
    });

    it('forgotPasswordApi / resetPasswordApi — success and failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(mkResp({ success: true }));
      await expect(
        api.forgotPasswordApi({ email: 'a' })
      ).resolves.toBeDefined();
      await expect(
        api.resetPasswordApi({ password: 'p', token: 't' })
      ).resolves.toBeDefined();

      global.fetch = jest.fn().mockResolvedValue(mkResp({ success: false }));
      await expect(api.forgotPasswordApi({ email: 'a' })).rejects.toBeDefined();
      await expect(
        api.resetPasswordApi({ password: 'p', token: 't' })
      ).rejects.toBeDefined();
    });

    it('logoutApi — success and failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(mkResp({ success: true }));
      // @ts-ignore
      localStorage.setItem('refreshToken', 'r');
      await expect(api.logoutApi()).resolves.toBeDefined();

      global.fetch = jest
        .fn()
        .mockResolvedValue(mkResp({ success: false }, false));
      await expect(api.logoutApi()).rejects.toBeDefined();
    });
  });
});
