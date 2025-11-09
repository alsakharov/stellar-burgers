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
import type { RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

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

describe('user saveTokens via registerUser/loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // простая заглушка localStorage
    const lsMock = new LocalStorageMock();
    // присваиваем в глобальный объект
    (global as unknown as { localStorage: Storage }).localStorage = lsMock;
  });

  it('registerUser сохраняет токены и возвращает user', async () => {
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'X', email: 'x@x' },
      accessToken: 'Bearer atkn',
      refreshToken: 'rtkn'
    });

    const dispatch = makeThunkDispatchMock<RootState>();
    const getState = () => ({}) as RootState;

    const res = await registerUser({
      name: 'X',
      email: 'x@x',
      password: 'p'
    })(dispatch, getState, undefined);

    expect(res.type).toBe(registerUser.fulfilled.type);
    expect(setCookie).toHaveBeenCalled();
    expect(
      (global as unknown as { localStorage: Storage }).localStorage.getItem(
        'refreshToken'
      )
    ).toBe('rtkn');
  });
});
