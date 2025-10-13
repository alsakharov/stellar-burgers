import { FC, useMemo } from 'react';
import { useSelector, useDispatch } from '../../services/store';
import { useNavigate, useLocation } from 'react-router-dom';
import { TIngredient } from '../../utils/types';
import { TConstructorIngredientWithId } from '../burger-constructor-element/type';
import { BurgerConstructorUI } from '@ui';
import { createOrder, closeOrderModal } from '../../features/order/orderSlice';
import { ModalUI } from '../ui/modal/modal';
import { OrderDetailsUI } from '../ui/order-details/order-details';

export const BurgerConstructor: FC = () => {
  const constructorItems = useSelector((state: any) => state.constructorItems);
  const orderRequest = useSelector((state: any) => state.order.orderRequest);
  const orderModalData = useSelector(
    (state: any) => state.order.orderModalData
  );
  const user = useSelector((state: any) => state.user.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Проверяем, не открыт ли сейчас роут модалки заказа
  const isOrderModalRoute =
    location.pathname.startsWith('/feed/') ||
    location.pathname.startsWith('/profile/orders/');

  const onOrderClick = () => {
    if (!constructorItems.bun || orderRequest) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const ingredientsIds = [
      constructorItems.bun._id,
      ...constructorItems.ingredients.map(
        (item: TConstructorIngredientWithId) => item._id
      ),
      constructorItems.bun._id
    ];
    dispatch(createOrder(ingredientsIds));
  };

  const handleCloseOrderModal = () => {
    dispatch(closeOrderModal());
  };

  const price = useMemo(
    () =>
      (constructorItems.bun ? constructorItems.bun.price * 2 : 0) +
      constructorItems.ingredients.reduce(
        (s: number, v: TConstructorIngredientWithId) => s + v.price,
        0
      ),
    [constructorItems]
  );

  return (
    <>
      <BurgerConstructorUI
        price={price}
        orderRequest={orderRequest}
        constructorItems={{
          bun: constructorItems.bun as TIngredient | null,
          ingredients:
            constructorItems.ingredients as TConstructorIngredientWithId[]
        }}
        orderModalData={orderModalData}
        onOrderClick={onOrderClick}
        closeOrderModal={handleCloseOrderModal}
      />
      {orderModalData && orderModalData.order && !isOrderModalRoute && (
        <ModalUI title='' onClose={handleCloseOrderModal}>
          <OrderDetailsUI orderNumber={orderModalData.order.number} />
        </ModalUI>
      )}
    </>
  );
};
