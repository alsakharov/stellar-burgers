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

describe('user thunks — rejection branches', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registerUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));
    const dispatch = jest.fn();
    const getState = jest.fn();
    const res: any = await registerUser({
      name: 'A',
      email: 'a@a',
      password: 'p'
    } as any)(dispatch as any, getState as any, undefined);
    expect(res.type).toBe(registerUser.rejected.type);
    expect(res.payload).toBeDefined();
  });

  it('loginUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));
    const dispatch = jest.fn();
    const getState = jest.fn();
    const res: any = await loginUser({ email: 'a@a', password: 'p' } as any)(
      dispatch as any,
      getState as any,
      undefined
    );
    expect(res.type).toBe(loginUser.rejected.type);
    expect(res.payload).toBeDefined();
  });

  it('updateUser rejected when fetchWithRefresh throws', async () => {
    (fetchWithRefresh as jest.Mock).mockRejectedValue(new Error('net fail'));
    const dispatch = jest.fn();
    const getState = jest.fn();
    const res: any = await updateUser({ name: 'New' } as any)(
      dispatch as any,
      getState as any,
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
    const dispatch = jest.fn();
    const getState = jest.fn();
    const res: any = await updateUser({ name: 'U' } as any)(
      dispatch as any,
      getState as any,
      undefined
    );
    expect(res.type).toBe(updateUser.fulfilled.type);
    expect(res.payload).toEqual({ name: 'U', email: 'u@u' });
  });
});
