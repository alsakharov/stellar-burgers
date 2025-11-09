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
import {
  registerUser,
  loginUser,
  updateUser
} from '../features/user/userSlice';
import type { RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

describe('user thunks — rejection branches', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registerUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));

    const dispatch = makeThunkDispatchMock<RootState>();

    const res = await registerUser({
      name: 'A',
      email: 'a@a',
      password: 'p'
    })(dispatch, () => ({}) as RootState, undefined);

    expect(res.type).toBe(registerUser.rejected.type);
    expect(res.payload).toBeDefined();
  });

  it('loginUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));

    const dispatch = makeThunkDispatchMock<RootState>();

    const res = await loginUser({ email: 'a@a', password: 'p' })(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(res.type).toBe(loginUser.rejected.type);
    expect(res.payload).toBeDefined();
  });

  it('updateUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));

    const dispatch = makeThunkDispatchMock<RootState>();

    const res = await updateUser({ name: 'New' })(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(res.type).toBe(updateUser.rejected.type);
    expect(res.payload).toBeDefined();
  });

  it('updateUser uses empty authorization header when no cookie', async () => {
    (getCookie as jest.Mock).mockReturnValue('');
    // when fetchWithRefresh resolves, updateUser should still fulfill or reject depending on mocked value
    (fetchWithRefresh as jest.Mock).mockResolvedValue({
      success: true,
      user: { name: 'U', email: 'u@u' }
    });

    const dispatch = makeThunkDispatchMock<RootState>();

    const res = await updateUser({ name: 'U' })(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(res.type).toBe(updateUser.fulfilled.type);
    expect(res.payload).toEqual({ name: 'U', email: 'u@u' });
  });
});
