import React, { FC, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from '../../services/store';
import type { RootState } from '../../services/store';
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
import type {
  TIngredient,
  TConstructorIngredient,
  TOrder
} from '../../utils/types';
import type { TIngredientInstance } from '../../features/constructorItems/constructorItemsSlice';

/* ---------- безопасные хелперы для чтения unknown как record ------------ */
const asRecord = (x: unknown): Record<string, unknown> =>
  x && typeof x === 'object' ? (x as Record<string, unknown>) : {};

const getStr = (rec: Record<string, unknown>, key: string, d = ''): string =>
  typeof rec[key] === 'string' ? (rec[key] as string) : String(rec[key] ?? d);

const getNum = (rec: Record<string, unknown>, key: string, d = 0): number => {
  const v = rec[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
};

const genUniqueId = (base?: string) =>
  `${base || 'item'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/* ---------------------------------------------------------------------- */

/* guard: payload содержит поле order */
const isOrderPayload = (x: unknown): x is { order: TOrder } =>
  !!x && typeof x === 'object' && 'order' in (x as Record<string, unknown>);

/* guard: parsed from dataTransfer содержит _id */
function isParsedIngredient(x: unknown): x is Record<string, unknown> {
  return (
    !!x && typeof x === 'object' && '_id' in (x as Record<string, unknown>)
  );
}

/* конвертер из TIngredientInstance (из стора) → полный TConstructorIngredient */
const toConstructorIngredient = (
  it: TIngredientInstance
): TConstructorIngredient => {
  const rec = asRecord(it);
  const _id = getStr(rec, '_id');
  const uniqueId =
    (typeof rec.uniqueId === 'string' && rec.uniqueId) ||
    (typeof rec._uid === 'string' && rec._uid) ||
    genUniqueId(_id || 'x');

  return {
    _id,
    name: getStr(rec, 'name'),
    type: getStr(rec, 'type'),
    proteins: getNum(rec, 'proteins', 0),
    fat: getNum(rec, 'fat', 0),
    carbohydrates: getNum(rec, 'carbohydrates', 0),
    calories: getNum(rec, 'calories', 0),
    price: getNum(rec, 'price', 0),
    image: getStr(rec, 'image'),
    image_large: getStr(rec, 'image_large'),
    image_mobile: getStr(rec, 'image_mobile'),
    uniqueId
  } as TConstructorIngredient;
};

/* аналогичный конвертер для булки → TIngredient */
const toIngredient = (it: TIngredientInstance): TIngredient => {
  const rec = asRecord(it);
  return {
    _id: getStr(rec, '_id'),
    name: getStr(rec, 'name'),
    type: getStr(rec, 'type'),
    proteins: getNum(rec, 'proteins', 0),
    fat: getNum(rec, 'fat', 0),
    carbohydrates: getNum(rec, 'carbohydrates', 0),
    calories: getNum(rec, 'calories', 0),
    price: getNum(rec, 'price', 0),
    image: getStr(rec, 'image'),
    image_large: getStr(rec, 'image_large'),
    image_mobile: getStr(rec, 'image_mobile')
  } as TIngredient;
};

export const BurgerConstructor: FC = () => {
  const constructorItems = useSelector(
    (state: RootState) => state.constructorItems
  );
  const orderRequest = useSelector(
    (state: RootState) => state.order.orderRequest ?? false
  );
  const orderModalData = useSelector(
    (state: RootState) => state.order.orderModalData
  );
  const user = useSelector((state: RootState) => state.user.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isOrderModalRoute =
    location.pathname.startsWith('/feed/') ||
    location.pathname.startsWith('/profile/orders/');

  // приводим сырьё в UI-friendly формы
  const uiIngredients: TConstructorIngredient[] = (
    constructorItems?.ingredients ?? []
  )
    .filter((it): it is TIngredientInstance => !!it && typeof it === 'object')
    .map((it) => toConstructorIngredient(it));

  const uiBun: TIngredient | null = constructorItems?.bun
    ? toIngredient(constructorItems.bun)
    : null;

  const makeIngredientsIds = (): string[] => {
    const idsFromIngredients = uiIngredients
      .map((i) => i._id)
      .filter((id): id is string => !!id);
    const bunId = uiBun?._id ?? '';
    return [bunId, ...idsFromIngredients, bunId].filter(
      (id): id is string => id.length > 0
    );
  };

  const onOrderClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!uiBun || orderRequest) return;

    const ingredientsIds = makeIngredientsIds();

    dispatch(createOrder(ingredientsIds)).then((action) => {
      if (
        createOrder.fulfilled.match(
          action as ReturnType<typeof createOrder.fulfilled>
        )
      ) {
        dispatch(clearConstructor());
      }
    });
  };

  useEffect(() => {
    if (isOrderPayload(orderModalData)) {
      dispatch(clearConstructor());
    }
  }, [dispatch, orderModalData]);

  const handleCloseOrderModal = () => {
    dispatch(closeOrderModal());
  };

  const price = useMemo(() => {
    const bunPart = uiBun ? uiBun.price * 2 : 0;
    const ingPart = uiIngredients.reduce((s, v) => s + (v.price ?? 0), 0);
    return bunPart + ingPart;
  }, [uiBun, uiIngredients]);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();

    const processed = new Set<string>();
    const UID_TTL = 3000;

    const handleParsed = (
      parsed: unknown,
      uid: string | null,
      acceptType: 'bun' | 'ingredient' | 'all'
    ) => {
      if (!isParsedIngredient(parsed)) return;
      const rec = asRecord(parsed);
      const parsedId = getStr(rec, '_id');
      const parsedType = getStr(rec, 'type');
      if (!parsedId) return;

      if (uid) {
        if (processed.has(uid)) return;
        processed.add(uid);
        setTimeout(() => processed.delete(uid), UID_TTL);
      }

      if (acceptType === 'bun' && parsedType !== 'bun') return;
      if (acceptType === 'ingredient' && parsedType === 'bun') return;

      const inst: TIngredientInstance = {
        _id: parsedId,
        type: parsedType || undefined,
        price: getNum(rec, 'price', 0),
        uniqueId:
          (typeof rec.uniqueId === 'string' && rec.uniqueId) ||
          (typeof rec._uid === 'string' && rec._uid) ||
          genUniqueId(parsedId),
        ...(rec as Record<string, unknown>)
      };

      dispatch(addIngredient(inst));
      dispatch(increaseCount({ id: parsedId, type: parsedType }));
    };

    const parseFromDataTransfer = (
      dt: DataTransfer | null,
      acceptType: 'bun' | 'ingredient' | 'all'
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
          let payloadUid = uid;
          if (parsed && typeof parsed === 'object') {
            const p = asRecord(parsed);
            if (typeof p.__dragUid === 'string')
              payloadUid = p.__dragUid as string;
          }
          handleParsed(parsed, payloadUid, acceptType);
          return;
        } catch {
          // noop
        }
      }

      const items = dt.items;
      if (items && items.length) {
        const first = items[0];
        if (
          first &&
          typeof (first as DataTransferItem).getAsString === 'function'
        ) {
          (first as DataTransferItem).getAsString((s: string) => {
            try {
              const parsed = JSON.parse(s);
              let payloadUid = uid;
              if (parsed && typeof parsed === 'object') {
                const p = asRecord(parsed);
                if (typeof p.__dragUid === 'string')
                  payloadUid = p.__dragUid as string;
              }
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
        parseFromDataTransfer(e.dataTransfer!, 'all');
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
  }, [dispatch, constructorItems]);

  return (
    <>
      <BurgerConstructorUI
        price={price}
        orderRequest={orderRequest}
        constructorItems={{ bun: uiBun, ingredients: uiIngredients }}
        orderModalData={
          isOrderPayload(orderModalData) ? orderModalData.order : null
        }
        onOrderClick={onOrderClick}
        closeOrderModal={handleCloseOrderModal}
      />
      {isOrderPayload(orderModalData) && !isOrderModalRoute && (
        <ModalUI title='' onClose={handleCloseOrderModal}>
          <OrderDetailsUI orderNumber={orderModalData.order.number} />
        </ModalUI>
      )}
    </>
  );
};

export default BurgerConstructor;
