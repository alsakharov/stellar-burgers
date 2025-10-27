import React, { FC, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from '../../services/store';
import { useNavigate, useLocation } from 'react-router-dom';
import { BurgerConstructorUI } from '@ui';
import { createOrder, closeOrderModal } from '../../features/order/orderSlice';
import { ModalUI } from '../ui/modal/modal';
import { OrderDetailsUI } from '../ui/order-details/order-details';
import {
  clearConstructor,
  addIngredient
} from '../../features/constructorItems/constructorItemsSlice';
import { increaseCount } from '../../features/ingredients/ingredientsSlice';
import type { TConstructorIngredientWithId } from '../burger-constructor-element/type';

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

  const isOrderModalRoute =
    location.pathname.startsWith('/feed/') ||
    location.pathname.startsWith('/profile/orders/');

  const onOrderClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!constructorItems?.bun || orderRequest) return;

    const ingredientsIds = [
      constructorItems.bun._id,
      ...(
        (constructorItems.ingredients || []) as TConstructorIngredientWithId[]
      ).map((it) => it._id),
      constructorItems.bun._id
    ];

    dispatch(createOrder(ingredientsIds)).then((action: any) => {
      if (createOrder.fulfilled.match(action)) {
        // немедленная очистка конструктора при успешном создании заказа
        dispatch(clearConstructor());
      }
      // на случай асинхронных внешних установок orderModalData — есть useEffect ниже
    });
  };

  useEffect(() => {
    if (orderModalData && orderModalData.order) {
      // idempotent очистка конструктора при появлении данных заказа
      dispatch(clearConstructor());
    }
  }, [dispatch, orderModalData]);

  const handleCloseOrderModal = () => {
    dispatch(closeOrderModal());
  };

  const price = useMemo(
    () =>
      (constructorItems?.bun ? (constructorItems.bun.price || 0) * 2 : 0) +
      (constructorItems?.ingredients || []).reduce(
        (s: number, v: TConstructorIngredientWithId) => s + (v.price || 0),
        0
      ),
    [constructorItems]
  );

  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();

    const processed = new Set<string>();
    const UID_TTL = 3000;

    const handleParsed = (
      parsed: any,
      uid: string | null,
      acceptType: 'bun' | 'ingredient' | 'any'
    ) => {
      if (!parsed || !parsed._id) return;
      if (uid) {
        if (processed.has(uid)) return;
        processed.add(uid);
        setTimeout(() => processed.delete(uid), UID_TTL);
      }
      if (acceptType === 'bun' && parsed.type !== 'bun') return;
      if (acceptType === 'ingredient' && parsed.type === 'bun') return;

      dispatch(addIngredient(parsed));
      dispatch(increaseCount({ id: parsed._id, type: parsed.type }));
    };

    const parseFromDataTransfer = (
      dt: DataTransfer | null,
      acceptType: 'bun' | 'ingredient' | 'any'
    ) => {
      if (!dt) return;
      let uid: string | null = null;
      try {
        uid = dt.getData('text/uid') || null;
      } catch {
        uid = null;
      }
      let json = '';
      try {
        json = dt.getData('application/json') || dt.getData('text/plain') || '';
      } catch {
        json = '';
      }

      if (json) {
        try {
          const parsed = JSON.parse(json);
          const payloadUid =
            parsed && parsed.__dragUid ? parsed.__dragUid : uid;
          handleParsed(parsed, payloadUid, acceptType);
          return;
        } catch {
          // noop
        }
      }

      const items = (dt as any).items;
      if (items && items.length) {
        const first = items[0];
        if (first && typeof first.getAsString === 'function') {
          first.getAsString((s: string) => {
            try {
              const parsed = JSON.parse(s);
              const payloadUid =
                parsed && parsed.__dragUid ? parsed.__dragUid : uid;
              handleParsed(parsed, payloadUid, acceptType);
            } catch {
              // noop
            }
          });
        }
      }
    };

    const bunTopEl = document.querySelector(
      '[data-cy="constructor_bun_top"], [data-cy="bun_1_constructor"], [data-cy="bun-top"], [data-cy="bun_top"]'
    ) as HTMLElement | null;
    const bunBottomEl = document.querySelector(
      '[data-cy="constructor_bun_bottom"], [data-cy="bun_2_constructor"], [data-cy="bun-bottom"], [data-cy="bun_bottom"]'
    ) as HTMLElement | null;
    const ingredientsEl = document.querySelector(
      '[data-cy="ingredient_constructor"], [data-cy="ingredients_list"], [data-cy="constructor_ingredients"]'
    ) as HTMLElement | null;

    const bunTopDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        parseFromDataTransfer(e.dataTransfer!, 'bun');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BurgerConstructor] bunTop drop parse error', err);
      }
    };
    const bunBottomDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        parseFromDataTransfer(e.dataTransfer!, 'bun');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BurgerConstructor] bunBottom drop parse error', err);
      }
    };
    const ingredientsDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        parseFromDataTransfer(e.dataTransfer!, 'ingredient');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BurgerConstructor] ingredients drop parse error', err);
      }
    };
    const windowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        parseFromDataTransfer(e.dataTransfer!, 'any');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BurgerConstructor] window drop parse error', err);
      }
    };

    if (bunTopEl) {
      bunTopEl.addEventListener('dragover', onDragOver);
      bunTopEl.addEventListener('drop', bunTopDrop);
    }
    if (bunBottomEl) {
      bunBottomEl.addEventListener('dragover', onDragOver);
      bunBottomEl.addEventListener('drop', bunBottomDrop);
    }
    if (ingredientsEl) {
      ingredientsEl.addEventListener('dragover', onDragOver);
      ingredientsEl.addEventListener('drop', ingredientsDrop);
    }

    const usedWindowFallback = !bunTopEl && !bunBottomEl && !ingredientsEl;
    if (usedWindowFallback) {
      window.addEventListener('dragover', onDragOver);
      window.addEventListener('drop', windowDrop);
    }

    return () => {
      if (bunTopEl) {
        bunTopEl.removeEventListener('dragover', onDragOver);
        bunTopEl.removeEventListener('drop', bunTopDrop);
      }
      if (bunBottomEl) {
        bunBottomEl.removeEventListener('dragover', onDragOver);
        bunBottomEl.removeEventListener('drop', bunBottomDrop);
      }
      if (ingredientsEl) {
        ingredientsEl.removeEventListener('dragover', onDragOver);
        ingredientsEl.removeEventListener('drop', ingredientsDrop);
      }
      if (usedWindowFallback) {
        window.removeEventListener('dragover', onDragOver);
        window.removeEventListener('drop', windowDrop);
      }
    };
  }, [dispatch]);

  return (
    <>
      <BurgerConstructorUI
        price={price}
        orderRequest={orderRequest}
        constructorItems={{
          bun: constructorItems.bun,
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

export default BurgerConstructor;
