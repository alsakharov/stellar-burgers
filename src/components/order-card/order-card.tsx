import React, { FC, memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from '../../services/store';
import { OrderCardProps } from './type';
import { TIngredient } from '@utils-types';
import { OrderCardUI } from '../ui/order-card/order-card';

const maxIngredients = 6;

export const OrderCard: FC<OrderCardProps> = memo(({ order }) => {
  const location = useLocation();

  const ingredients = useSelector(
    (state) => state.ingredients.items ?? []
  ) as TIngredient[];

  const orderInfo = useMemo(() => {
    if (!ingredients.length || !order || !Array.isArray(order.ingredients)) {
      return null;
    }

    const ingredientsInfo: TIngredient[] = order.ingredients.reduce<
      TIngredient[]
    >((acc, id) => {
      const ingredient = ingredients.find((ing) => ing._id === id);
      if (ingredient) acc.push(ingredient);
      return acc;
    }, []);

    const total = ingredientsInfo.reduce(
      (acc, item) => acc + (Number(item.price) || 0),
      0
    );

    const ingredientsToShow = ingredientsInfo.slice(0, maxIngredients);
    const remains = Math.max(0, ingredientsInfo.length - maxIngredients);
    const date = order.createdAt ? new Date(order.createdAt) : new Date();

    return {
      ...order,
      ingredientsInfo,
      ingredientsToShow,
      remains,
      total,
      date
    };
  }, [order, ingredients]);

  if (!orderInfo) return null;

  // locationState передаётся в <Link state={locationState}> для modal routing
  const locationState = { background: location, order };

  return (
    <OrderCardUI
      orderInfo={orderInfo}
      maxIngredients={maxIngredients}
      locationState={locationState}
    />
  );
});

export default OrderCard;
