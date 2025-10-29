jest.mock('../utils/burger-api', () => ({
  fetchWithRefresh: jest.fn()
}));
jest.mock('../utils/cookie', () => ({
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
  getCookie: jest.fn()
}));

import { fetchWithRefresh } from '../utils/burger-api';
import { setCookie, getCookie } from '../utils/cookie';
import {
  registerUser,
  loginUser,
  fetchUser,
  logout
} from '../features/user/userSlice';
import type { RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

describe('user thunks', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });

  it('registerUser saves tokens and returns user', async () => {
    // arrange
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'U', email: 'u@u' },
      accessToken: 'Bearer atok',
      refreshToken: 'rtok'
    });

    // act
    const dispatch = makeThunkDispatchMock<RootState>();
    const res = await registerUser({ name: 'u', email: 'e', password: 'p' })(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(setCookie).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeDefined();
    expect(localStorage.getItem('refreshToken')).toBeDefined();
  });

  it('loginUser saves tokens and returns user', async () => {
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'L', email: 'l@l' },
      accessToken: 'Bearer atok2',
      refreshToken: 'rt2'
    });

    const dispatch = makeThunkDispatchMock<RootState>();
    const res = await loginUser({ email: 'l@l', password: 'p' })(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(res.type).toMatch(/\/fulfilled$/);
    expect(setCookie).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeDefined();
  });

  it('fetchUser rejects when no token', async () => {
    (getCookie as jest.Mock).mockReturnValue(undefined);

    const dispatch = makeThunkDispatchMock<RootState>();
    const res = await fetchUser()(dispatch, () => ({}) as RootState, undefined);

    expect(res.type).toMatch(/\/rejected$/);
    expect(res.payload).toBe('Нет токена');
  });

  it('fetchUser on fetch error dispatches logout and rejects', async () => {
    (getCookie as jest.Mock).mockReturnValue('tok');
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('401'));

    const dispatch = makeThunkDispatchMock<RootState>();
    const res = await fetchUser()(dispatch, () => ({}) as RootState, undefined);

    // Проверяем, что logout был диспатчен
    const dispatchedTypes = (dispatch as unknown as jest.Mock).mock.calls.map(
      (c) => (c[0] as { type?: string } | undefined)?.type
    );
    expect(dispatchedTypes.some((t) => t === logout().type)).toBe(true);

    expect(res.type).toMatch(/\/rejected$/);
  });
});
