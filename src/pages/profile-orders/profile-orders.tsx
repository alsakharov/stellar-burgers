import { ProfileOrdersUI } from '@ui-pages';
import { FC, useEffect } from 'react';
import { useSelector, useDispatch } from '../../services/store';
import {
  wsConnect,
  wsDisconnect
} from '../../features/profileOrders/profileOrdersSlice';
import { getCookie } from '../../utils/cookie';

export const ProfileOrders: FC = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.profileOrders.orders);

  useEffect(() => {
    // Берём токен из cookie!
    const token = getCookie('accessToken');
    if (token) {
      dispatch(
        wsConnect(`wss://norma.nomoreparties.space/orders?token=${token}`)
      );
    }
    return () => {
      dispatch(wsDisconnect());
    };
  }, [dispatch]);

  return <ProfileOrdersUI orders={orders} />;
};
