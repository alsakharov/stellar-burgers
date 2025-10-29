import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderBurgerApi } from '../../utils/burger-api';
import { clearConstructor } from '../constructorItems/constructorItemsSlice';
import { resetCounts } from '../ingredients/ingredientsSlice';
import type { TOrder } from '../../utils/types';

type CreateOrderResponse = {
  success: boolean;
  order: TOrder;
  name?: string;
};

/**
 * createOrder:
 * - Возвращает CreateOrderResponse (включая поле order),
 * - В случае rejectWithValue передаём строку (сообщение ошибки).
 */
export const createOrder = createAsyncThunk<
  CreateOrderResponse,
  string[],
  { rejectValue: string }
>('order/createOrder', async (ingredients: string[], thunkAPI) => {
  try {
    const response = await orderBurgerApi(ingredients);

    // Очистка конструктора и сброс счётчиков ингредиентов (best-effort)
    try {
      thunkAPI.dispatch(clearConstructor());
      thunkAPI.dispatch(resetCounts());
    } catch {
      // noop
    }

    return response as CreateOrderResponse;
  } catch (error: unknown) {
    // Корректно извлекаем строковое сообщение из unknown
    let message = 'Ошибка заказа';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    } else {
      message = String(error ?? message);
    }
    return thunkAPI.rejectWithValue(message);
  }
});

interface OrderState {
  orderRequest: boolean;
  // либо успешный ответ с полем `order`, либо объект ошибки, либо null
  orderModalData: CreateOrderResponse | { error: string } | null;
}

const initialState: OrderState = {
  orderRequest: false,
  orderModalData: null
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    closeOrderModal(state) {
      state.orderModalData = null;
      state.orderRequest = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.orderRequest = true;
        state.orderModalData = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderRequest = false;
        // action.payload типизирован как CreateOrderResponse
        state.orderModalData = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderRequest = false;
        // action.payload может быть string | undefined
        state.orderModalData = { error: action.payload ?? 'Ошибка заказа' };
      });
  }
});

export const { closeOrderModal } = orderSlice.actions;
export default orderSlice.reducer;
