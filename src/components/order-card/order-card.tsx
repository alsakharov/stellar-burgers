import React, { FC, memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from '../../services/store';
import { OrderCardProps } from './type';
import { TIngredient } from '@utils-types';
import { OrderCardUI } from '../ui/order-card/order-card';

const maxIngredients = 6;

export const OrderCard: FC<OrderCardProps> = memo(({ order }) => {
  const location = useLocation();

  const ingredients: TIngredient[] = useSelector(
    (state: any) => state.ingredients.items || []
  );

  const orderInfo = useMemo(() => {
    if (!ingredients.length || !order || !Array.isArray(order.ingredients))
      return null;

    const ingredientsInfo = order.ingredients.reduce(
      (acc: TIngredient[], id: string) => {
        const ingredient = ingredients.find((ing) => ing._id === id);
        if (ingredient) acc.push(ingredient);
        return acc;
      },
      [] as TIngredient[]
    );

    const total = ingredientsInfo.reduce(
      (acc, item) => acc + (item.price || 0),
      0
    );

    const ingredientsToShow = ingredientsInfo.slice(0, maxIngredients);
    const remains =
      ingredientsInfo.length > maxIngredients
        ? ingredientsInfo.length - maxIngredients
        : 0;
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

  // Безопасный объект state — background и сам order (для modal routing)
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
