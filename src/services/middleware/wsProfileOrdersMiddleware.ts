import { Middleware } from '@reduxjs/toolkit';
import {
  wsConnect,
  wsDisconnect,
  wsError,
  wsMessage
} from '../../features/profileOrders/profileOrdersSlice';

export const wsProfileOrdersMiddleware: Middleware = (store) => {
  let socket: WebSocket | null = null;

  return (next) => (action) => {
    if (wsConnect.match(action)) {
      const token = localStorage.getItem('accessToken')?.replace('Bearer ', '');
      socket = new WebSocket(
        `wss://norma.nomoreparties.space/orders?token=${token}`
      );
      socket.onopen = () => {};
      socket.onerror = (event) => {
        store.dispatch(wsError('WebSocket error'));
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.success) {
          store.dispatch(
            wsMessage({
              orders: data.orders,
              total: data.total,
              totalToday: data.totalToday
            })
          );
        }
      };
      socket.onclose = () => {
        store.dispatch(wsDisconnect());
      };
    }

    if (wsDisconnect.match(action) && socket) {
      socket.close();
      socket = null;
    }

    return next(action);
  };
};
