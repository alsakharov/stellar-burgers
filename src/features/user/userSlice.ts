import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithRefresh } from '../../utils/burger-api';
import { setCookie, deleteCookie, getCookie } from '../../utils/cookie';

const URL = 'https://norma.education-services.ru/api';

interface User {
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isUserLoaded: boolean;
}

const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
  isUserLoaded: false
};

interface RegisterUserResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface LoginUserResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface UpdateUserResponse {
  success: boolean;
  user: User;
}

// --- Сохраняем токены в cookie с expires (14 дней) ---
function saveTokens(accessToken: string, refreshToken: string) {
  setCookie('accessToken', accessToken.replace('Bearer ', ''), {
    expires: 1209600
  });
  setCookie('refreshToken', refreshToken, { expires: 1209600 });
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

const extractErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err ?? 'Unknown error');

export const registerUser = createAsyncThunk<
  User,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('user/registerUser', async (data, thunkAPI) => {
  try {
    const res = (await fetchWithRefresh(`${URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })) as RegisterUserResponse;
    saveTokens(res.accessToken, res.refreshToken);
    return res.user;
  } catch (err: unknown) {
    return thunkAPI.rejectWithValue(extractErrorMessage(err));
  }
});

export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('user/loginUser', async (data, thunkAPI) => {
  try {
    const res = (await fetchWithRefresh(`${URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })) as LoginUserResponse;
    saveTokens(res.accessToken, res.refreshToken);
    return res.user;
  } catch (err: unknown) {
    return thunkAPI.rejectWithValue(extractErrorMessage(err));
  }
});

export const updateUser = createAsyncThunk<
  User,
  { name?: string; email?: string; password?: string },
  { rejectValue: string }
>('user/updateUser', async (data, thunkAPI) => {
  try {
    const accessToken = getCookie('accessToken');
    const res = (await fetchWithRefresh(`${URL}/auth/user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken ? `Bearer ${accessToken}` : ''
      },
      body: JSON.stringify(data)
    })) as UpdateUserResponse;
    return res.user;
  } catch (err: unknown) {
    return thunkAPI.rejectWithValue(extractErrorMessage(err));
  }
});

// Thunk для получения пользователя с обработкой 403 и отсутствия токена
export const fetchUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'user/fetchUser',
  async (_, thunkAPI) => {
    const accessToken = getCookie('accessToken');
    if (
      !accessToken ||
      accessToken === 'undefined' ||
      accessToken === 'null' ||
      accessToken === ''
    ) {
      // Нет токена — не делаем запрос, возвращаем ошибку
      return thunkAPI.rejectWithValue('Нет токена');
    }
    try {
      const res = (await fetchWithRefresh(`${URL}/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${accessToken}`
        }
      })) as { user: User };
      return res.user;
    } catch (err: unknown) {
      // безопасно извлекаем сообщение
      thunkAPI.dispatch(logout());
      return thunkAPI.rejectWithValue('Сессия истекла, войдите снова');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isUserLoaded = true;
    },
    logout(state) {
      state.user = null;
      state.isUserLoaded = true;
      deleteCookie('accessToken');
      deleteCookie('refreshToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isUserLoaded = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isUserLoaded = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? extractErrorMessage(action.error);
        state.isUserLoaded = true;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isUserLoaded = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isUserLoaded = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? extractErrorMessage(action.error);
        state.isUserLoaded = true;
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isUserLoaded = true;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? extractErrorMessage(action.error);
        state.isUserLoaded = true;
      })
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isUserLoaded = false;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isUserLoaded = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? extractErrorMessage(action.error);
        state.user = null;
        state.isUserLoaded = true;
      });
  }
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
