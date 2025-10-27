import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderBurgerApi } from '../../utils/burger-api';
import { clearConstructor } from '../constructorItems/constructorItemsSlice';
import { resetCounts } from '../ingredients/ingredientsSlice';

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (ingredients: string[], thunkAPI) => {
    try {
      const response = await orderBurgerApi(ingredients);

      // Очистка конструктора и сброс счётчиков ингредиентов
      try {
        thunkAPI.dispatch(clearConstructor());
        thunkAPI.dispatch(resetCounts());
      } catch {
        // noop
      }

      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Ошибка заказа');
    }
  }
);

interface OrderState {
  orderRequest: boolean;
  orderModalData: any;
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
        state.orderModalData = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderRequest = false;
        state.orderModalData = { error: action.payload };
      });
  }
});

export const { closeOrderModal } = orderSlice.actions;
export default orderSlice.reducer;
