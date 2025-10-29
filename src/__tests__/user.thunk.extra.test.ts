jest.mock('../utils/cookie', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  deleteCookie: jest.fn()
}));

jest.mock('../utils/burger-api', () => ({
  fetchWithRefresh: jest.fn()
}));

import { getCookie } from '../utils/cookie';
import { fetchWithRefresh } from '../utils/burger-api';
import reducer, { fetchUser, logout } from '../features/user/userSlice';
import type { RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

describe('user.fetchUser thunk — дополнительные ветви', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects когда нет токена', async () => {
    (getCookie as jest.Mock).mockReturnValue('');

    const dispatch = makeThunkDispatchMock<RootState>();

    const result = await fetchUser()(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(result.type).toBe(fetchUser.rejected.type);
    expect(result.payload).toBe('Нет токена');
  });

  it('fulfills когда токен есть и fetchWithRefresh возвращает user', async () => {
    (getCookie as jest.Mock).mockReturnValue('my-token');
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      user: { name: 'A', email: 'a@a' }
    });

    const dispatch = makeThunkDispatchMock<RootState>();

    const result = await fetchUser()(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(result.type).toBe(fetchUser.fulfilled.type);
    expect(result.payload).toEqual({ name: 'A', email: 'a@a' });
  });

  it('при ошибке fetchWithRefresh диспатчит logout и отклоняется с сообщением о сессии', async () => {
    (getCookie as jest.Mock).mockReturnValue('tok');
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net err'));

    const dispatch = makeThunkDispatchMock<RootState>();

    const result = await fetchUser()(
      dispatch,
      () => ({}) as RootState,
      undefined
    );
    expect(result.type).toBe(fetchUser.rejected.type);

    // Проверяем, что logout был диспатчен
    const dispatched = (dispatch as unknown as jest.Mock).mock.calls.map(
      (c) => (c[0] as { type?: string } | undefined)?.type
    );
    expect(dispatched).toContain(logout.type);

    expect(result.payload).toBe('Сессия истекла, войдите снова');
  });
});
