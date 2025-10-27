import { Middleware } from '@reduxjs/toolkit';
import {
  wsConnect,
  wsDisconnect,
  wsError,
  wsMessage
} from '../../features/profileOrders/profileOrdersSlice';
import { getCookie } from '../../utils/cookie';
import { getOrdersApi } from '../../utils/burger-api';

const DEFAULT_WS = 'wss://norma.nomoreparties.space';
const WS_BASE = process.env.WS_URL || DEFAULT_WS;

function readRawToken(): string | null {
  const fromLS =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    '';
  const fromCookie =
    getCookie('accessToken') || getCookie('access_token') || '';
  const token = fromLS || fromCookie;
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, '').trim();
}

async function fetchOrdersFallback(store: any) {
  try {
    const orders = await getOrdersApi();
    store.dispatch(
      wsMessage({
        orders: orders || [],
        total: 0,
        totalToday: 0
      })
    );
  } catch (e) {
    store.dispatch(wsError('WS and HTTP fallback both failed'));
  }
}

export const wsProfileOrdersMiddleware: Middleware = (store) => {
  let socket: WebSocket | null = null;
  let connecting = false;
  let manualClose = false;
  let fallbackUsed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const MAX_RECONNECT = 1;
  let reconnectAttempts = 0;
  let lastErrorAt = 0;

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const shouldAttemptWs = () => {
    if (process.env.WS_URL) return true;
    if (typeof window === 'undefined') return false;
    if (localStorage.getItem('disableWs') === '1') return false;
    const h = window.location.hostname;
    return h !== 'localhost' && h !== '127.0.0.1' && h !== '';
  };

  const startConnect = async () => {
    if (connecting) return;
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    )
      return;

    if (!shouldAttemptWs()) {
      if (!fallbackUsed) {
        fallbackUsed = true;
        await fetchOrdersFallback(store);
      }
      if (Date.now() - lastErrorAt > 5000) {
        lastErrorAt = Date.now();
        store.dispatch(wsError('WebSocket skipped in current environment'));
      }
      return;
    }

    const token = readRawToken();
    if (!token) {
      if (!fallbackUsed) {
        fallbackUsed = true;
        await fetchOrdersFallback(store);
      }
      if (Date.now() - lastErrorAt > 5000) {
        lastErrorAt = Date.now();
        store.dispatch(wsError('No access token for WS'));
      }
      return;
    }

    try {
      await getOrdersApi();
    } catch {
      if (!fallbackUsed) {
        fallbackUsed = true;
        await fetchOrdersFallback(store);
      }
      if (Date.now() - lastErrorAt > 5000) {
        lastErrorAt = Date.now();
        store.dispatch(wsError('API unreachable — using HTTP fallback'));
      }
      return;
    }

    const url = `${WS_BASE.replace(/\/$/, '')}/orders?token=${encodeURIComponent(token)}`;

    try {
      connecting = true;
      socket = new WebSocket(url);
    } catch {
      connecting = false;
      if (!fallbackUsed) {
        fallbackUsed = true;
        await fetchOrdersFallback(store);
      }
      if (Date.now() - lastErrorAt > 5000) {
        lastErrorAt = Date.now();
        store.dispatch(wsError('WebSocket constructor error'));
      }
      return;
    }

    socket.onopen = () => {
      connecting = false;
      reconnectAttempts = 0;
      clearReconnectTimer();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        store.dispatch(
          wsMessage({
            orders: data.orders ?? [],
            total: data.total ?? 0,
            totalToday: data.totalToday ?? 0
          })
        );
      } catch {
        // silently ignore parse errors
      }
    };

    socket.onerror = () => {
      if (Date.now() - lastErrorAt > 5000) {
        lastErrorAt = Date.now();
        store.dispatch(wsError('WebSocket error'));
      }
    };

    socket.onclose = async (ev) => {
      connecting = false;
      socket = null;

      if (manualClose) {
        manualClose = false;
        return;
      }

      if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts += 1;
        const delay = 2000;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          startConnect();
        }, delay);
      } else {
        if (!fallbackUsed) {
          fallbackUsed = true;
          if (Date.now() - lastErrorAt > 5000) {
            lastErrorAt = Date.now();
            store.dispatch(wsError('WS failed, using HTTP fallback'));
          }
          await fetchOrdersFallback(store);
        }
      }
    };
  };

  return (next) => (action) => {
    if (wsConnect.match(action)) {
      if (socket) {
        manualClose = true;
        try {
          socket.close(1000, 'reconnect');
        } catch {
          // noop
        }
        socket = null;
      }
      fallbackUsed = false;
      reconnectAttempts = 0;
      startConnect();
      return next(action);
    }

    if (wsDisconnect.match(action)) {
      manualClose = true;
      clearReconnectTimer();
      if (socket) {
        try {
          socket.close(1000, 'client disconnect');
        } catch {
          // noop
        }
        socket = null;
      }
      connecting = false;
      reconnectAttempts = 0;
      fallbackUsed = false;
      return next(action);
    }

    return next(action);
  };
};
