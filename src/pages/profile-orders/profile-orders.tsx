import React, { FC, useEffect } from 'react';
import { useSelector, useDispatch } from '../../services/store';
import { ProfileOrdersUI } from '@ui-pages';
import {
  wsConnect,
  wsDisconnect
} from '../../features/profileOrders/profileOrdersSlice';
import { getCookie } from '../../utils/cookie';

export const ProfileOrders: FC = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state: any) => state.profileOrders.orders);
  // получаем токен из cookie (или null)
  const token = getCookie('accessToken') || null;

  useEffect(() => {
    if (token) {
      dispatch(
        wsConnect(
          `wss://norma.nomoreparties.space/orders?token=${encodeURIComponent(
            token
          )}`
        )
      );
    }

    return () => {
      dispatch(wsDisconnect());
    };
    // добавляем token в зависимости, чтобы подключение появлялось при его наличии
  }, [dispatch, token]);

  return <ProfileOrdersUI orders={orders} />;
};

export default ProfileOrders;
