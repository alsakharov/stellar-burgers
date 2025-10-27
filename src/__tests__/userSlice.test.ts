import reducer, {
  setUser,
  logout,
  registerUser,
  loginUser,
  updateUser,
  fetchUser
} from '../features/user/userSlice';

jest.mock('../utils/burger-api', () => ({
  fetchWithRefresh: jest.fn()
}));

jest.mock('../utils/cookie', () => ({
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
  getCookie: jest.fn()
}));

describe('user slice', () => {
  const initial = reducer(undefined, { type: '@@INIT' } as any);

  it('инициализируется с корректным initial state', () => {
    expect(initial).toHaveProperty('user', null);
    expect(initial).toHaveProperty('isLoading', false);
    expect(initial).toHaveProperty('error', null);
    expect(initial).toHaveProperty('isUserLoaded', false);
  });

  it('setUser устанавливает пользователя и isUserLoaded = true', () => {
    const user = { name: 'A', email: 'a@a' };
    const next = reducer(initial, setUser(user));
    expect(next.user).toEqual(user);
    expect(next.isUserLoaded).toBe(true);
  });

  it('logout очищает user и удаляет токены', () => {
    const stateWithUser = {
      ...initial,
      user: { name: 'X', email: 'x@x' },
      isUserLoaded: true
    };
    const next = reducer(stateWithUser as any, logout());
    expect(next.user).toBeNull();
    expect(next.isUserLoaded).toBe(true);
  });

  it('registerUser.pending ставит isLoading = true', () => {
    const action = registerUser.pending('reqId', {
      name: 'a',
      email: 'b',
      password: 'p'
    } as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.isUserLoaded).toBe(false);
  });

  it('registerUser.fulfilled записывает user и сбрасывает isLoading', () => {
    const user = { name: 'U', email: 'u@u' };
    const action = registerUser.fulfilled(user as any, 'reqId', {} as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.user).toEqual(user);
    expect(next.isUserLoaded).toBe(true);
  });

  it('registerUser.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = { type: registerUser.rejected.type, payload: 'err' } as any;
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('err');
    expect(next.isUserLoaded).toBe(true);
  });

  it('loginUser.pending ставит isLoading = true', () => {
    const action = loginUser.pending('reqId', {
      email: 'e',
      password: 'p'
    } as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.isUserLoaded).toBe(false);
  });

  it('loginUser.fulfilled записывает user и сбрасывает isLoading', () => {
    const user = { name: 'L', email: 'l@l' };
    const action = loginUser.fulfilled(user as any, 'reqId', {} as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.user).toEqual(user);
    expect(next.isUserLoaded).toBe(true);
  });

  it('loginUser.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = {
      type: loginUser.rejected.type,
      payload: 'err-login'
    } as any;
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('err-login');
    expect(next.isUserLoaded).toBe(true);
  });

  it('updateUser.pending ставит isLoading = true', () => {
    const action = updateUser.pending('reqId', {} as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('updateUser.fulfilled обновляет user и сбрасывает isLoading', () => {
    const user = { name: 'Upd', email: 'upd@u' };
    const action = updateUser.fulfilled(user as any, 'reqId', {} as any);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.user).toEqual(user);
    expect(next.isUserLoaded).toBe(true);
  });

  it('updateUser.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = {
      type: updateUser.rejected.type,
      payload: 'err-update'
    } as any;
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('err-update');
    expect(next.isUserLoaded).toBe(true);
  });

  it('fetchUser.pending ставит isLoading = true', () => {
    const action = fetchUser.pending('reqId', undefined);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.isUserLoaded).toBe(false);
  });

  it('fetchUser.fulfilled записывает user и сбрасывает isLoading', () => {
    const user = { name: 'F', email: 'f@f' };
    const action = fetchUser.fulfilled(user as any, 'reqId', undefined);
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.user).toEqual(user);
    expect(next.isUserLoaded).toBe(true);
  });

  it('fetchUser.rejected сбрасывает user, записывает ошибку и isUserLoaded = true', () => {
    const action = {
      type: fetchUser.rejected.type,
      payload: 'no token'
    } as any;
    const next = reducer(initial, action);
    expect(next.isLoading).toBe(false);
    expect(next.user).toBeNull();
    expect(next.error).toBe('no token');
    expect(next.isUserLoaded).toBe(true);
  });
});
