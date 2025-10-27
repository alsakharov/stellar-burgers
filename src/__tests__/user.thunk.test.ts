// mocks: api + cookie
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

describe('user thunks', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });

  it('registerUser saves tokens and returns user', async () => {
    // arrange
    // @ts-ignore
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'U', email: 'u@u' },
      accessToken: 'Bearer atok',
      refreshToken: 'rtok'
    });

    // act
    const dispatchMock = jest.fn();
    // @ts-ignore
    const res = await registerUser({ name: 'u', email: 'e', password: 'p' })(
      dispatchMock,
      () => ({}),
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(setCookie).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeDefined();
    expect(localStorage.getItem('refreshToken')).toBeDefined();
  });

  it('loginUser saves tokens and returns user', async () => {
    // @ts-ignore
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'L', email: 'l@l' },
      accessToken: 'Bearer atok2',
      refreshToken: 'rt2'
    });

    const dispatchMock = jest.fn();
    // @ts-ignore
    const res = await loginUser({ email: 'l@l', password: 'p' })(
      dispatchMock,
      () => ({}),
      undefined
    );

    expect(res.type).toMatch(/\/fulfilled$/);
    expect(setCookie).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeDefined();
  });

  it('fetchUser rejects when no token', async () => {
    (getCookie as jest.Mock).mockReturnValue(undefined);
    const dispatchMock = jest.fn();
    // @ts-ignore
    const res = await fetchUser()(dispatchMock, () => ({}), undefined);
    expect(res.type).toMatch(/\/rejected$/);
    expect(res.payload).toBe('Нет токена');
  });

  it('fetchUser on fetch error dispatches logout and rejects', async () => {
    (getCookie as jest.Mock).mockReturnValue('tok');
    // @ts-ignore
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('401'));
    const dispatchMock = jest.fn();
    // @ts-ignore
    const res = await fetchUser()(dispatchMock, () => ({}), undefined);
    expect(
      dispatchMock.mock.calls.some((c) => c[0] && c[0].type === logout().type)
    ).toBe(true);
    expect(res.type).toMatch(/\/rejected$/);
  });
});
