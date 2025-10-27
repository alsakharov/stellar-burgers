jest.mock('../utils/cookie', () => ({
  setCookie: jest.fn(),
  getCookie: jest.fn(),
  deleteCookie: jest.fn()
}));
jest.mock('../utils/burger-api', () => ({
  fetchWithRefresh: jest.fn()
}));

import { setCookie } from '../utils/cookie';
import { fetchWithRefresh } from '../utils/burger-api';
import { registerUser } from '../features/user/userSlice';

describe('user saveTokens via registerUser/loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // простая заглушка localStorage
    const store: Record<string, string> = {};
    // @ts-ignore
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k]
    };
  });

  it('registerUser сохраняет токены и возвращает user', async () => {
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'X', email: 'x@x' },
      accessToken: 'Bearer atkn',
      refreshToken: 'rtkn'
    });
    const dispatch = jest.fn();
    const getState = jest.fn();
    const res: any = await registerUser({
      name: 'X',
      email: 'x@x',
      password: 'p'
    } as any)(dispatch as any, getState as any, undefined);
    expect(res.type).toBe(registerUser.fulfilled.type);
    // проверяем, что setCookie вызван и localStorage содержит refreshToken
    expect(setCookie).toHaveBeenCalledWith(
      'accessToken',
      'atkn',
      expect.any(Object)
    );
    // @ts-ignore
    expect(localStorage.getItem('refreshToken')).toBe('rtkn');
  });
});
