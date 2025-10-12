import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit';

interface Order {
  _id: string;
  number: number;
  name: string;
  status: string;
  ingredients: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProfileOrdersState {
  orders: Order[];
  total: number;
  totalToday: number;
  wsConnected: boolean;
  error: string | null;
}

const initialState: ProfileOrdersState = {
  orders: [],
  total: 0,
  totalToday: 0,
  wsConnected: false,
  error: null
};

// Экшены для управления WebSocket
export const wsConnect = createAction<string>('profileOrders/wsConnect');
export const wsDisconnect = createAction('profileOrders/wsDisconnect');
export const wsError = createAction<string>('profileOrders/wsError');
export const wsMessage = createAction<{
  orders: Order[];
  total: number;
  totalToday: number;
}>('profileOrders/wsMessage');

const profileOrdersSlice = createSlice({
  name: 'profileOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(wsConnect, (state) => {
        state.wsConnected = true;
        state.error = null;
      })
      .addCase(wsDisconnect, (state) => {
        state.wsConnected = false;
      })
      .addCase(wsError, (state, action) => {
        state.error = action.payload;
      })
      .addCase(wsMessage, (state, action) => {
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.totalToday = action.payload.totalToday;
      });
  }
});

export default profileOrdersSlice.reducer;
